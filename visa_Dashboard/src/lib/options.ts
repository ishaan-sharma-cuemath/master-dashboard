// ————————————————————————————————————————————————
// Shared option sets for the visa tracker.
// Combobox fields (country / visa_type / vendor / approved_by / form_name / location)
// take these as *presets* — users can also type custom values which get persisted.
// Status fields are fixed dropdowns sourced from the current tracking sheet.
// ————————————————————————————————————————————————

export const COUNTRIES = ["United States", "Australia", "New Zealand", "United Kingdom"] as const;
export const VISA_TYPES = ["O1 VISA", "B1/B2 VISA", "AUS VISA", "NZ VISA", "UK VISA"] as const;
export const VENDORS = ["MMT", "Atlys", "Rahul", "Susan", "Others"] as const;
export const APPROVERS = ["Bandhan", "Himanshu", "Others"] as const;
export const FORM_NAMES = ["DS 160"] as const;

// Fixed status dropdowns
export const FORM_FILLUP = ["Not Filled", "Filled"] as const;
export const FORM_SUBMISSION = ["No", "Yes"] as const;
export const DAY_STATUS = [
  "Process not Started",
  "Waiting for Date",
  "Interview Date Announced",
  "Interview Over",
] as const;
export const FINAL_RESULT = ["Process not Started", "VISA Granted", "VISA Rejected"] as const;
export const DOC_SIGNED = ["Not Sent", "Sent & Not Signed", "Sent & Signed"] as const;

export type FormFillup = (typeof FORM_FILLUP)[number];
export type FormSubmission = (typeof FORM_SUBMISSION)[number];
export type DayStatus = (typeof DAY_STATUS)[number];
export type FinalResult = (typeof FINAL_RESULT)[number];
export type DocSigned = (typeof DOC_SIGNED)[number];

// Combobox preset registry — field key -> default presets.
export const PRESET_FIELDS = ["country", "visa_type", "vendor", "approved_by", "form_name", "location"] as const;
export type PresetField = (typeof PRESET_FIELDS)[number];

export const DEFAULT_PRESETS: Record<PresetField, readonly string[]> = {
  country: COUNTRIES,
  visa_type: VISA_TYPES,
  vendor: VENDORS,
  approved_by: APPROVERS,
  form_name: FORM_NAMES,
  location: [],
};

// Visual tone per status value — maps to the design-token color families.
export type Tone = "green" | "amber" | "red" | "blue" | "neutral";

export function statusTone(value: string | null | undefined): Tone {
  switch (value) {
    case "Filled":
    case "Yes":
    case "Interview Over":
    case "VISA Granted":
    case "Sent & Signed":
      return "green";
    case "Interview Date Announced":
      return "amber";
    case "Waiting for Date":
    case "Sent & Not Signed":
      return "blue";
    case "Not Filled":
    case "No":
    case "VISA Rejected":
      return "red";
    case "Process not Started":
    case "Not Sent":
    default:
      return "neutral";
  }
}
