import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import {
  DAY_STATUS,
  DOC_SIGNED,
  FINAL_RESULT,
  FORM_FILLUP,
  FORM_SUBMISSION,
  PRESET_FIELDS,
} from "@/lib/options";

const pk = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const nowIso = () => new Date().toISOString();

export const visaApplications = sqliteTable(
  "visa_applications",
  {
    id: pk(),

    // Identity
    name: text("name").notNull(),
    email: text("email").notNull(),

    // Grouping / classification (free-typed comboboxes, so plain text)
    country: text("country").notNull(),
    visaType: text("visa_type").notNull(),
    vendor: text("vendor"),
    approvedBy: text("approved_by"),

    // Optional process flags
    formRequired: integer("form_required", { mode: "boolean" }).notNull().default(false),
    formName: text("form_name"),
    biometricRequired: integer("biometric_required", { mode: "boolean" }).notNull().default(false),
    interviewRequired: integer("interview_required", { mode: "boolean" }).notNull().default(false),

    // Pipeline statuses (fixed dropdowns)
    formFillup: text("form_fillup", { enum: FORM_FILLUP }),
    formSubmission: text("form_submission", { enum: FORM_SUBMISSION }),
    biometricStatus: text("biometric_status", { enum: DAY_STATUS }),
    interviewStatus: text("interview_status", { enum: DAY_STATUS }),
    finalResult: text("final_result", { enum: FINAL_RESULT }).notNull().default("Process not Started"),

    // Stage detail
    biometricDate: text("biometric_date"),
    biometricLocation: text("biometric_location"),
    interviewDate: text("interview_date"),
    interviewLocation: text("interview_location"),

    // Validity (range)
    validFrom: text("valid_from"),
    validTo: text("valid_to"),

    // Costs
    vendorFees: real("vendor_fees"),
    visaFees: real("visa_fees"),
    flightCost: real("flight_cost"),
    stayDays: integer("stay_days"),
    travelNotes: text("travel_notes"),

    // Docs
    docSigned: text("doc_signed", { enum: DOC_SIGNED }).notNull().default("Not Sent"),

    notes: text("notes"),

    createdAt: text("created_at").notNull().$defaultFn(nowIso),
    updatedAt: text("updated_at").notNull().$defaultFn(nowIso),
  },
  (t) => [
    index("visa_country_idx").on(t.country),
    index("visa_result_idx").on(t.finalResult),
    index("visa_created_idx").on(t.createdAt),
  ],
);

// Remembered combobox values (defaults + user-typed customs).
export const optionPresets = sqliteTable(
  "option_presets",
  {
    id: pk(),
    field: text("field", { enum: PRESET_FIELDS }).notNull(),
    value: text("value").notNull(),
    createdAt: text("created_at").notNull().$defaultFn(nowIso),
  },
  (t) => [uniqueIndex("preset_field_value_idx").on(t.field, t.value)],
);

export type VisaApplicationRow = typeof visaApplications.$inferSelect;
export type NewVisaApplication = typeof visaApplications.$inferInsert;
export type OptionPresetRow = typeof optionPresets.$inferSelect;
