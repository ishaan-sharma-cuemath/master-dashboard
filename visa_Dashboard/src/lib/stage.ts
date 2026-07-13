import type { VisaApplicationRow } from "./db/schema";
import type { Tone } from "./options";

export type StageKey =
  | "granted"
  | "rejected"
  | "awaiting_result"
  | "interview_scheduled"
  | "biometric"
  | "submitted"
  | "form_fill"
  | "not_started";

export type Stage = { key: StageKey; label: string; tone: Tone };

// A single "where is this application right now" summary, derived from the
// per-stage status fields. Order matters — later stages win.
export function deriveStage(a: VisaApplicationRow): Stage {
  if (a.finalResult === "VISA Granted") return { key: "granted", label: "Granted", tone: "green" };
  if (a.finalResult === "VISA Rejected") return { key: "rejected", label: "Rejected", tone: "red" };
  if (a.interviewRequired && a.interviewStatus === "Interview Over")
    return { key: "awaiting_result", label: "Awaiting result", tone: "amber" };
  if (a.interviewRequired && a.interviewStatus === "Interview Date Announced")
    return { key: "interview_scheduled", label: "Interview scheduled", tone: "blue" };
  if (a.biometricRequired && (a.biometricStatus === "Interview Date Announced" || a.biometricStatus === "Interview Over"))
    return { key: "biometric", label: "Biometric", tone: "blue" };
  if (a.formSubmission === "Yes") return { key: "submitted", label: "Form submitted", tone: "blue" };
  if (a.formFillup === "Filled") return { key: "form_fill", label: "Form filled", tone: "neutral" };
  return { key: "not_started", label: "Not started", tone: "neutral" };
}

export const STAGE_ORDER: StageKey[] = [
  "not_started",
  "form_fill",
  "submitted",
  "biometric",
  "interview_scheduled",
  "awaiting_result",
  "granted",
  "rejected",
];
