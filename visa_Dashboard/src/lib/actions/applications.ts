"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-dal";
import { db } from "@/lib/db/client";
import { optionPresets, visaApplications, type NewVisaApplication } from "@/lib/db/schema";
import {
  DAY_STATUS,
  DOC_SIGNED,
  FINAL_RESULT,
  FORM_FILLUP,
  FORM_SUBMISSION,
  type PresetField,
} from "@/lib/options";

export type FormState = { ok: boolean; error?: string };

function str(fd: FormData, k: string): string | undefined {
  const v = fd.get(k);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

function bool(fd: FormData, k: string): boolean {
  return fd.get(k) != null;
}

function num(fd: FormData, k: string): number | undefined {
  const v = str(fd, k);
  if (v === undefined) return undefined;
  const n = Number(v.replace(/[,\s₹$]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

function oneOf<T extends readonly string[]>(fd: FormData, k: string, allowed: T): T[number] | undefined {
  const v = str(fd, k);
  return v !== undefined && (allowed as readonly string[]).includes(v) ? (v as T[number]) : undefined;
}

/** Parse + validate the form into a row. Returns an error string on failure. */
function buildRow(fd: FormData): { row?: NewVisaApplication; error?: string } {
  const name = str(fd, "name");
  const email = str(fd, "email");
  const country = str(fd, "country");
  const visaType = str(fd, "visaType");

  if (!name) return { error: "Name is required." };
  if (!email) return { error: "Email is required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
  if (!country) return { error: "Country is required." };
  if (!visaType) return { error: "Visa type is required." };

  const formRequired = bool(fd, "formRequired");
  const biometricRequired = bool(fd, "biometricRequired");
  const interviewRequired = bool(fd, "interviewRequired");

  const finalResult = oneOf(fd, "finalResult", FINAL_RESULT) ?? "Process not Started";
  const vendorFees = num(fd, "vendorFees");
  const visaFees = num(fd, "visaFees");

  // Rule: once granted, visa + vendor fees are mandatory.
  if (finalResult === "VISA Granted") {
    if (visaFees === undefined) return { error: "Visa fees are required once the visa is granted." };
    if (vendorFees === undefined) return { error: "Vendor fees are required once the visa is granted." };
  }

  const formName = formRequired ? str(fd, "formName") ?? "DS 160" : undefined;
  const biometricLocation = biometricRequired ? str(fd, "biometricLocation") : undefined;
  const interviewLocation = interviewRequired ? str(fd, "interviewLocation") : undefined;

  const row: NewVisaApplication = {
    name,
    email,
    country,
    visaType,
    vendor: str(fd, "vendor"),
    approvedBy: str(fd, "approvedBy"),
    formRequired,
    formName,
    biometricRequired,
    interviewRequired,
    formFillup: formRequired ? oneOf(fd, "formFillup", FORM_FILLUP) : undefined,
    formSubmission: formRequired ? oneOf(fd, "formSubmission", FORM_SUBMISSION) : undefined,
    biometricStatus: biometricRequired ? oneOf(fd, "biometricStatus", DAY_STATUS) : undefined,
    interviewStatus: interviewRequired ? oneOf(fd, "interviewStatus", DAY_STATUS) : undefined,
    finalResult,
    biometricDate: biometricRequired ? str(fd, "biometricDate") : undefined,
    biometricLocation,
    interviewDate: interviewRequired ? str(fd, "interviewDate") : undefined,
    interviewLocation,
    validFrom: str(fd, "validFrom"),
    validTo: str(fd, "validTo"),
    vendorFees,
    visaFees,
    flightCost: num(fd, "flightCost"),
    stayDays: num(fd, "stayDays"),
    travelNotes: str(fd, "travelNotes"),
    docSigned: oneOf(fd, "docSigned", DOC_SIGNED) ?? "Not Sent",
    notes: str(fd, "notes"),
  };

  return { row };
}

function rememberPreset(field: PresetField, value: string | null | undefined) {
  if (!value) return;
  db.insert(optionPresets).values({ field, value }).onConflictDoNothing().run();
}

function rememberPresetsFromRow(row: NewVisaApplication) {
  rememberPreset("country", row.country);
  rememberPreset("visa_type", row.visaType);
  rememberPreset("vendor", row.vendor);
  rememberPreset("approved_by", row.approvedBy);
  rememberPreset("form_name", row.formName);
  rememberPreset("location", row.biometricLocation);
  rememberPreset("location", row.interviewLocation);
}

export async function createApplication(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireUser();

  const { row, error } = buildRow(fd);
  if (error || !row) return { ok: false, error };

  db.insert(visaApplications).values(row).run();
  rememberPresetsFromRow(row);

  revalidatePath("/");
  revalidatePath("/applications");
  redirect("/applications");
}

export async function updateApplication(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  await requireUser();

  const { row, error } = buildRow(fd);
  if (error || !row) return { ok: false, error };

  db.update(visaApplications)
    .set({ ...row, updatedAt: new Date().toISOString() })
    .where(eq(visaApplications.id, id))
    .run();
  rememberPresetsFromRow(row);

  revalidatePath("/");
  revalidatePath("/applications");
  revalidatePath(`/applications/${id}`);
  redirect(`/applications/${id}`);
}

export async function deleteApplication(id: string): Promise<void> {
  await requireUser();

  db.delete(visaApplications).where(eq(visaApplications.id, id)).run();

  revalidatePath("/");
  revalidatePath("/applications");
  redirect("/applications");
}
