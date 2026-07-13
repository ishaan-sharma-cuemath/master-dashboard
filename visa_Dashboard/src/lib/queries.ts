import { desc } from "drizzle-orm";
import { db } from "./db/client";
import { optionPresets, visaApplications, type VisaApplicationRow } from "./db/schema";
import { DEFAULT_PRESETS, PRESET_FIELDS, type PresetField } from "./options";
import { deriveStage, type StageKey } from "./stage";

export function getPresets(): Record<PresetField, string[]> {
  const rows = db.select().from(optionPresets).all();
  const map = {} as Record<PresetField, string[]>;
  for (const f of PRESET_FIELDS) map[f] = [...DEFAULT_PRESETS[f]];
  for (const r of rows) {
    const f = r.field as PresetField;
    if (!map[f]) map[f] = [];
    if (!map[f].includes(r.value)) map[f].push(r.value);
  }
  return map;
}

export function getApplications(): VisaApplicationRow[] {
  return db.select().from(visaApplications).orderBy(desc(visaApplications.createdAt)).all();
}

export function getApplication(id: string): VisaApplicationRow | undefined {
  return db.select().from(visaApplications).all().find((a) => a.id === id);
}

export type CountryStat = {
  country: string;
  total: number;
  granted: number;
  rejected: number;
  inProgress: number;
};

export type Stats = {
  total: number;
  granted: number;
  rejected: number;
  inProgress: number;
  totalVisaFees: number;
  totalVendorFees: number;
  byCountry: CountryStat[];
  byStage: { key: StageKey; label: string; count: number }[];
};

export function getStats(apps: VisaApplicationRow[]): Stats {
  const countryMap = new Map<string, CountryStat>();
  const stageMap = new Map<StageKey, { label: string; count: number }>();
  let granted = 0;
  let rejected = 0;
  let inProgress = 0;
  let totalVisaFees = 0;
  let totalVendorFees = 0;

  for (const a of apps) {
    const stage = deriveStage(a);
    const c = countryMap.get(a.country) ?? { country: a.country, total: 0, granted: 0, rejected: 0, inProgress: 0 };
    c.total += 1;

    if (a.finalResult === "VISA Granted") {
      granted += 1;
      c.granted += 1;
    } else if (a.finalResult === "VISA Rejected") {
      rejected += 1;
      c.rejected += 1;
    } else {
      inProgress += 1;
      c.inProgress += 1;
    }
    countryMap.set(a.country, c);

    const s = stageMap.get(stage.key) ?? { label: stage.label, count: 0 };
    s.count += 1;
    stageMap.set(stage.key, s);

    totalVisaFees += a.visaFees ?? 0;
    totalVendorFees += a.vendorFees ?? 0;
  }

  return {
    total: apps.length,
    granted,
    rejected,
    inProgress,
    totalVisaFees,
    totalVendorFees,
    byCountry: [...countryMap.values()].sort((a, b) => b.total - a.total),
    byStage: [...stageMap.entries()]
      .map(([key, v]) => ({ key, label: v.label, count: v.count }))
      .sort((a, b) => b.count - a.count),
  };
}
