"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Combobox } from "@/components/ui/Combobox";
import { createApplication, type FormState } from "@/lib/actions/applications";
import {
  DAY_STATUS,
  DOC_SIGNED,
  FINAL_RESULT,
  FORM_FILLUP,
  FORM_SUBMISSION,
  type PresetField,
} from "@/lib/options";

const initial: FormState = { ok: false };

export function VisaForm({ presets }: { presets: Record<PresetField, string[]> }) {
  const [state, formAction, pending] = useActionState(createApplication, initial);

  const [formRequired, setFormRequired] = useState(false);
  const [biometricRequired, setBiometricRequired] = useState(false);
  const [interviewRequired, setInterviewRequired] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<string>("Process not Started");
  const [interviewStatus, setInterviewStatus] = useState<string>("Process not Started");
  const [finalResult, setFinalResult] = useState<string>("Process not Started");

  const showBiometricDetail = biometricStatus === "Interview Date Announced" || biometricStatus === "Interview Over";
  const showInterviewDetail = interviewStatus === "Interview Date Announced" || interviewStatus === "Interview Over";
  const granted = finalResult === "VISA Granted";

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {/* Applicant */}
      <Section title="Applicant">
        <Grid>
          <Field label="Name" required>
            <input name="name" className="field" placeholder="Full name" required />
          </Field>
          <Field label="Email" required>
            <input name="email" type="email" className="field" placeholder="name@example.com" required />
          </Field>
          <Field label="Country" required hint="Drives the dashboard breakdown">
            <Combobox name="country" presets={presets.country} placeholder="Select or type a country" required />
          </Field>
          <Field label="Visa type" required>
            <Combobox name="visaType" presets={presets.visa_type} placeholder="Select or type a visa type" required />
          </Field>
          <Field label="Vendor">
            <Combobox name="vendor" presets={presets.vendor} placeholder="Select or type a vendor" />
          </Field>
          <Field label="Approved by">
            <Combobox name="approvedBy" presets={presets.approved_by} placeholder="Select or type" />
          </Field>
        </Grid>
      </Section>

      {/* Process */}
      <Section title="Process" hint="Tick only what this visa needs — some countries skip the form, biometric, or interview.">
        <div className="flex flex-wrap gap-3">
          <Check name="formRequired" label="Form required" checked={formRequired} onChange={setFormRequired} />
          <Check name="biometricRequired" label="Biometrics" checked={biometricRequired} onChange={setBiometricRequired} />
          <Check name="interviewRequired" label="Interview" checked={interviewRequired} onChange={setInterviewRequired} />
        </div>
      </Section>

      {/* Form pipeline */}
      {formRequired && (
        <Section title="Form">
          <Grid>
            <Field label="Form name">
              <Combobox name="formName" presets={presets.form_name} defaultValue="DS 160" placeholder="e.g. DS 160" />
            </Field>
            <Field label="Form fill-up">
              <Select name="formFillup" options={FORM_FILLUP} placeholder="—" />
            </Field>
            <Field label="Form submission">
              <Select name="formSubmission" options={FORM_SUBMISSION} placeholder="—" />
            </Field>
          </Grid>
        </Section>
      )}

      {/* Biometric */}
      {biometricRequired && (
        <Section title="Biometric">
          <Grid>
            <Field label="Biometric status">
              <Select
                name="biometricStatus"
                options={DAY_STATUS}
                value={biometricStatus}
                onChange={setBiometricStatus}
              />
            </Field>
            {showBiometricDetail && (
              <>
                <Field label="Biometric date">
                  <input name="biometricDate" type="date" className="field" />
                </Field>
                <Field label="Biometric location">
                  <Combobox name="biometricLocation" presets={presets.location} placeholder="City" />
                </Field>
              </>
            )}
          </Grid>
        </Section>
      )}

      {/* Interview */}
      {interviewRequired && (
        <Section title="Interview">
          <Grid>
            <Field label="Interview status">
              <Select
                name="interviewStatus"
                options={DAY_STATUS}
                value={interviewStatus}
                onChange={setInterviewStatus}
              />
            </Field>
            {showInterviewDetail && (
              <>
                <Field label="Interview date">
                  <input name="interviewDate" type="date" className="field" />
                </Field>
                <Field label="Interview location">
                  <Combobox name="interviewLocation" presets={presets.location} placeholder="City" />
                </Field>
              </>
            )}
          </Grid>
        </Section>
      )}

      {/* Outcome */}
      <Section title="Outcome">
        <Grid>
          <Field label="Final result">
            <Select name="finalResult" options={FINAL_RESULT} value={finalResult} onChange={setFinalResult} />
          </Field>
          <Field label="Doc signed">
            <Select name="docSigned" options={DOC_SIGNED} defaultValue="Not Sent" />
          </Field>
          <Field label="Visa validity from">
            <input name="validFrom" type="date" className="field" />
          </Field>
          <Field label="Visa validity to">
            <input name="validTo" type="date" className="field" />
          </Field>
        </Grid>
      </Section>

      {/* Costs */}
      <Section
        title="Costs"
        hint={granted ? "Visa granted → vendor fees and visa fees are required." : "Optional — can be added any time."}
      >
        <Grid>
          <Field label="Vendor fees" required={granted}>
            <input name="vendorFees" type="number" min="0" step="1" className="field" placeholder="₹" required={granted} />
          </Field>
          <Field label="Visa fees" required={granted}>
            <input name="visaFees" type="number" min="0" step="1" className="field" placeholder="₹" required={granted} />
          </Field>
          <Field label="Flight cost" hint="Optional">
            <input name="flightCost" type="number" min="0" step="1" className="field" placeholder="₹" />
          </Field>
          <Field label="Stay (days)" hint="Optional">
            <input name="stayDays" type="number" min="0" step="1" className="field" placeholder="e.g. 14" />
          </Field>
        </Grid>
      </Section>

      {/* Notes */}
      <Section title="Notes">
        <textarea name="notes" className="field min-h-20" placeholder="Anything worth remembering…" />
      </Section>

      {state.error && (
        <div
          className="flex items-center gap-2 rounded-[10px] px-3 py-2.5 text-[13px]"
          style={{ background: "var(--health-red-soft)", color: "var(--health-red-text)" }}
        >
          <AlertTriangle size={15} /> {state.error}
        </div>
      )}

      <div className="flex items-center justify-end gap-2.5 pt-1">
        <Link href="/applications" className="btn btn-ghost">
          Cancel
        </Link>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save application"}
        </button>
      </div>
    </form>
  );
}

// ————— small building blocks —————

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <div className="microlabel">{title}</div>
      {hint && (
        <p className="mt-1 text-[12px]" style={{ color: "var(--ink-muted)" }}>
          {hint}
        </p>
      )}
      <div className="mt-3.5">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-[12.5px] font-medium" style={{ color: "var(--ink-secondary)" }}>
        {label}
        {required && <span style={{ color: "var(--health-red-text)" }}>*</span>}
        {hint && (
          <span className="font-normal" style={{ color: "var(--ink-muted)" }}>
            · {hint}
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

function Select({
  name,
  options,
  defaultValue,
  value,
  onChange,
  placeholder,
}: {
  name: string;
  options: readonly string[];
  defaultValue?: string;
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
}) {
  const controlled = value !== undefined;
  return (
    <select
      name={name}
      className="field"
      defaultValue={controlled ? undefined : defaultValue ?? ""}
      value={controlled ? value : undefined}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function Check({
  name,
  label,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className="flex cursor-pointer items-center gap-2 rounded-[9px] border px-3 py-2 text-[13px] transition-colors"
      style={{
        borderColor: checked ? "var(--accent)" : "var(--line-strong)",
        background: checked ? "var(--accent-soft)" : "transparent",
        color: checked ? "var(--accent)" : "var(--ink-secondary)",
        fontWeight: checked ? 600 : 400,
      }}
    >
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[var(--accent)]"
      />
      {label}
    </label>
  );
}
