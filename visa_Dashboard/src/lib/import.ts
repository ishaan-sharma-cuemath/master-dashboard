import type { NewVisaApplication } from "@/lib/db/schema";
import { DAY_STATUS, DOC_SIGNED, FINAL_RESULT, FORM_FILLUP, FORM_SUBMISSION } from "@/lib/options";

// A row parsed from the uploaded sheet, keyed by the original column headers.
export type RawRecord = Record<string, unknown>;

// Normalized-header → canonical field key. Handles the exact tracking-sheet
// column names plus a couple of forgiving aliases.
const HEADER_MAP: Record<string, string> = {
  name: "name",
  emailid: "email",
  email: "email",
  approvedby: "approvedBy",
  visatype: "visaType",
  vendor: "vendor",
  ds160formfillup: "formFillup",
  formfillup: "formFillup",
  ds160formsubmission: "formSubmission",
  formsubmission: "formSubmission",
  biometricinterviewday: "biometricStatus",
  interviewday: "interviewStatus",
  finalresult: "finalResult",
  biometricinterviewdate: "biometricDate",
  biometricinterviewlocation: "biometricLocation",
  interviewdate: "interviewDate",
  interviewlocation: "interviewLocation",
  visavalidity: "validity",
  vendorfees: "vendorFees",
  visafees: "visaFees",
  flightcostifany: "flightCost",
  flightcost: "flightCost",
  docsigned: "docSigned",
};

function norm(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Reduce a header-keyed record to canonical field keys. */
export function canonicalize(rec: RawRecord): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(rec)) {
    const field = HEADER_MAP[norm(k)];
    if (field && out[field] === undefined) out[field] = v == null ? "" : String(v);
  }
  return out;
}

function clean(v: string | undefined): string | undefined {
  if (v == null) return undefined;
  const t = String(v).trim();
  if (t === "" || t === "-" || t === "—" || t === "–") return undefined;
  return t;
}

function parseNum(v: string | undefined): number | undefined {
  const t = clean(v);
  if (t === undefined) return undefined;
  const n = Number(t.replace(/[,\s₹$]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

function matchEnum(v: string | undefined, allowed: readonly string[]): string | undefined {
  const t = clean(v);
  if (t === undefined) return undefined;
  return allowed.find((a) => a.toLowerCase() === t.toLowerCase());
}

/** The sheet has no Country column — derive it from the visa type. */
export function deriveCountry(visaType: string): string {
  const t = visaType.toUpperCase();
  if (t.includes("AUS") || t.includes("AUSTRALIA")) return "Australia";
  if (t.includes("NZ") || t.includes("NEW ZEALAND")) return "New Zealand";
  if (t.includes("UK") || t.includes("UNITED KINGDOM") || t.includes("BRITAIN")) return "United Kingdom";
  if (/\bO1\b|\bB1\b|\bB2\b|USA|\bUS\b/.test(t)) return "United States";
  return "Unknown";
}

function splitValidity(v: string | undefined): { from?: string; to?: string } {
  const t = clean(v);
  if (t === undefined) return {};
  const parts = t.split(/\s+TO\s+/i);
  if (parts.length >= 2) return { from: parts[0].trim(), to: parts.slice(1).join(" TO ").trim() };
  return { from: t };
}

export type MapResult = { row?: NewVisaApplication; skip?: string; warnings: string[] };

/** Map one raw sheet row to an insertable application (or a skip reason). */
export function mapRecord(rec: RawRecord): MapResult {
  const c = canonicalize(rec);
  const warnings: string[] = [];

  const name = clean(c.name);
  const email = clean(c.email);
  const visaType = clean(c.visaType);

  if (!name) return { skip: "row has no Name", warnings };
  if (!visaType) return { skip: `${name}: no VISA Type`, warnings };
  if (!email) return { skip: `${name}: no Email`, warnings };

  const formFillup = matchEnum(c.formFillup, FORM_FILLUP) as NewVisaApplication["formFillup"];
  const formSubmission = matchEnum(c.formSubmission, FORM_SUBMISSION) as NewVisaApplication["formSubmission"];
  const biometricStatus = matchEnum(c.biometricStatus, DAY_STATUS) as NewVisaApplication["biometricStatus"];
  const interviewStatus = matchEnum(c.interviewStatus, DAY_STATUS) as NewVisaApplication["interviewStatus"];
  const finalResult = (matchEnum(c.finalResult, FINAL_RESULT) ?? "Process not Started") as NewVisaApplication["finalResult"];
  const docSigned = (matchEnum(c.docSigned, DOC_SIGNED) ?? "Not Sent") as NewVisaApplication["docSigned"];

  if (clean(c.finalResult) && !matchEnum(c.finalResult, FINAL_RESULT))
    warnings.push(`${name}: unrecognized Final Result "${clean(c.finalResult)}" → Process not Started`);
  if (clean(c.docSigned) && !matchEnum(c.docSigned, DOC_SIGNED))
    warnings.push(`${name}: unrecognized Doc Signed "${clean(c.docSigned)}" → Not Sent`);

  const biometricDate = clean(c.biometricDate);
  const biometricLocation = clean(c.biometricLocation);
  const interviewDate = clean(c.interviewDate);
  const interviewLocation = clean(c.interviewLocation);
  const { from, to } = splitValidity(c.validity);

  const formRequired = !!(formFillup || formSubmission);
  const biometricRequired = !!(biometricStatus || biometricDate || biometricLocation);
  const interviewRequired = !!(interviewStatus || interviewDate || interviewLocation);

  const row: NewVisaApplication = {
    name,
    email,
    country: deriveCountry(visaType),
    visaType,
    vendor: clean(c.vendor),
    approvedBy: clean(c.approvedBy),
    formRequired,
    formName: formRequired ? "DS 160" : undefined,
    biometricRequired,
    interviewRequired,
    formFillup,
    formSubmission,
    biometricStatus,
    interviewStatus,
    finalResult,
    biometricDate,
    biometricLocation,
    interviewDate,
    interviewLocation,
    validFrom: from,
    validTo: to,
    vendorFees: parseNum(c.vendorFees),
    visaFees: parseNum(c.visaFees),
    flightCost: parseNum(c.flightCost),
    docSigned,
  };

  return { row, warnings };
}

export function dedupeKey(r: { email: string | null; visaType: string }): string {
  return `${(r.email ?? "").toLowerCase()}||${r.visaType.toLowerCase()}`;
}
