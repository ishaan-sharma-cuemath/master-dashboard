"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-dal";
import { db } from "@/lib/db/client";
import { optionPresets, visaApplications } from "@/lib/db/schema";
import { dedupeKey, mapRecord, type RawRecord } from "@/lib/import";
import type { PresetField } from "@/lib/options";

export type ImportResult = {
  imported: number;
  skipped: number;
  duplicates: number;
  messages: string[];
};

export async function importApplications(records: RawRecord[]): Promise<ImportResult> {
  await requireUser();

  const existing = db
    .select({ email: visaApplications.email, visaType: visaApplications.visaType })
    .from(visaApplications)
    .all();
  const seen = new Set(existing.map((e) => dedupeKey(e)));

  let imported = 0;
  let skipped = 0;
  let duplicates = 0;
  const messages: string[] = [];
  const presets: { field: PresetField; value: string }[] = [];

  for (const rec of records) {
    const { row, skip, warnings } = mapRecord(rec);
    if (skip || !row) {
      skipped++;
      if (skip) messages.push(`Skipped — ${skip}`);
      continue;
    }
    const key = dedupeKey({ email: row.email, visaType: row.visaType });
    if (seen.has(key)) {
      duplicates++;
      messages.push(`Duplicate — ${row.name} (${row.visaType}) already exists`);
      continue;
    }
    seen.add(key);
    db.insert(visaApplications).values(row).run();
    imported++;
    for (const w of warnings) messages.push(w);

    presets.push({ field: "country", value: row.country });
    presets.push({ field: "visa_type", value: row.visaType });
    if (row.vendor) presets.push({ field: "vendor", value: row.vendor });
    if (row.approvedBy) presets.push({ field: "approved_by", value: row.approvedBy });
    if (row.biometricLocation) presets.push({ field: "location", value: row.biometricLocation });
    if (row.interviewLocation) presets.push({ field: "location", value: row.interviewLocation });
  }

  for (const p of presets) db.insert(optionPresets).values(p).onConflictDoNothing().run();

  revalidatePath("/");
  revalidatePath("/applications");
  return { imported, skipped, duplicates, messages: messages.slice(0, 60) };
}
