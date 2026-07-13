/**
 * Seed script — inserts default combobox presets and a set of FICTIONAL sample
 * visa applications so the dashboard has something to render.
 *
 * IMPORTANT: every record below is invented. No real applicant data is used here.
 *
 *   npm run db:seed          # insert presets + sample rows if empty
 *   npm run db:reset         # wipe both tables, then reseed (--fresh)
 */
import { db } from "./client";
import { optionPresets, visaApplications, type NewVisaApplication } from "./schema";
import { DEFAULT_PRESETS, PRESET_FIELDS, type PresetField } from "@/lib/options";

const fresh = process.argv.includes("--fresh");

function seedPresets() {
  for (const field of PRESET_FIELDS) {
    for (const value of DEFAULT_PRESETS[field as PresetField]) {
      db.insert(optionPresets).values({ field, value }).onConflictDoNothing().run();
    }
  }
}

// ————— Fictional sample data (invented) —————
const samples: NewVisaApplication[] = [
  {
    name: "Ava Thompson",
    email: "ava.thompson@example.com",
    country: "United States",
    visaType: "B1/B2 VISA",
    vendor: "MMT",
    approvedBy: "Bandhan",
    formRequired: true,
    formName: "DS 160",
    biometricRequired: true,
    interviewRequired: true,
    formFillup: "Filled",
    formSubmission: "Yes",
    biometricStatus: "Interview Over",
    interviewStatus: "Interview Over",
    finalResult: "VISA Granted",
    biometricDate: "2025-06-04",
    biometricLocation: "Mumbai",
    interviewDate: "2025-06-11",
    interviewLocation: "Mumbai",
    validFrom: "2025-06-20",
    validTo: "2035-06-19",
    vendorFees: 25000,
    visaFees: 16095,
    flightCost: 19242,
    docSigned: "Not Sent",
  },
  {
    name: "Liam Carter",
    email: "liam.carter@example.com",
    country: "United States",
    visaType: "O1 VISA",
    vendor: "Atlys",
    approvedBy: "Himanshu",
    formRequired: true,
    formName: "DS 160",
    biometricRequired: true,
    interviewRequired: true,
    formFillup: "Filled",
    formSubmission: "Yes",
    biometricStatus: "Interview Over",
    interviewStatus: "Interview Over",
    finalResult: "VISA Granted",
    biometricDate: "2025-05-12",
    biometricLocation: "Delhi",
    interviewDate: "2025-05-20",
    interviewLocation: "Delhi",
    validFrom: "2025-06-01",
    validTo: "2035-05-30",
    vendorFees: 30000,
    visaFees: 16095,
    docSigned: "Sent & Signed",
  },
  {
    name: "Priya Kapoor",
    email: "priya.kapoor@example.com",
    country: "United States",
    visaType: "B1/B2 VISA",
    vendor: "Rahul",
    approvedBy: "Bandhan",
    formRequired: true,
    formName: "DS 160",
    biometricRequired: true,
    interviewRequired: true,
    formFillup: "Filled",
    formSubmission: "Yes",
    biometricStatus: "Interview Over",
    interviewStatus: "Interview Date Announced",
    finalResult: "Process not Started",
    biometricDate: "2025-07-18",
    biometricLocation: "Chennai",
    interviewDate: "2025-08-02",
    interviewLocation: "Chennai",
    vendorFees: 25000,
    visaFees: 16095,
    docSigned: "Not Sent",
  },
  {
    name: "Noah Bennett",
    email: "noah.bennett@example.com",
    country: "United States",
    visaType: "B1/B2 VISA",
    vendor: "Susan",
    approvedBy: "Himanshu",
    formRequired: true,
    formName: "DS 160",
    biometricRequired: true,
    interviewRequired: true,
    formFillup: "Filled",
    formSubmission: "Yes",
    biometricStatus: "Waiting for Date",
    interviewStatus: "Process not Started",
    finalResult: "Process not Started",
    vendorFees: 25000,
    visaFees: 16095,
    docSigned: "Not Sent",
  },
  {
    name: "Elena Rossi",
    email: "elena.rossi@example.com",
    country: "United States",
    visaType: "B1/B2 VISA",
    vendor: "Rahul",
    approvedBy: "Others",
    formRequired: true,
    formName: "DS 160",
    biometricRequired: false,
    interviewRequired: true,
    formFillup: "Not Filled",
    formSubmission: "No",
    interviewStatus: "Waiting for Date",
    finalResult: "Process not Started",
    docSigned: "Not Sent",
  },
  {
    name: "Marcus Webb",
    email: "marcus.webb@example.com",
    country: "United States",
    visaType: "B1/B2 VISA",
    vendor: "Susan",
    approvedBy: "Bandhan",
    formRequired: true,
    formName: "DS 160",
    biometricRequired: true,
    interviewRequired: true,
    formFillup: "Filled",
    formSubmission: "Yes",
    biometricStatus: "Interview Over",
    interviewStatus: "Interview Over",
    finalResult: "VISA Rejected",
    biometricDate: "2025-04-22",
    biometricLocation: "Bengaluru",
    interviewDate: "2025-05-06",
    interviewLocation: "Bengaluru",
    vendorFees: 25000,
    visaFees: 16095,
    docSigned: "Sent & Not Signed",
  },
  {
    name: "Sofia Mendes",
    email: "sofia.mendes@example.com",
    country: "Australia",
    visaType: "AUS VISA",
    vendor: "MMT",
    approvedBy: "Himanshu",
    finalResult: "VISA Granted",
    validFrom: "2025-01-31",
    validTo: "2028-01-30",
    visaFees: 13500,
    docSigned: "Not Sent",
  },
  {
    name: "Diego Alvarez",
    email: "diego.alvarez@example.com",
    country: "Australia",
    visaType: "AUS VISA",
    vendor: "MMT",
    approvedBy: "Himanshu",
    finalResult: "VISA Granted",
    validFrom: "2025-02-12",
    validTo: "2028-02-11",
    visaFees: 13500,
    docSigned: "Not Sent",
  },
  {
    name: "Hannah Kim",
    email: "hannah.kim@example.com",
    country: "New Zealand",
    visaType: "NZ VISA",
    vendor: "MMT",
    approvedBy: "Himanshu",
    finalResult: "VISA Granted",
    validFrom: "2025-02-10",
    validTo: "2026-02-10",
    visaFees: 15000,
    docSigned: "Not Sent",
  },
  {
    name: "Oliver Grant",
    email: "oliver.grant@example.com",
    country: "New Zealand",
    visaType: "NZ VISA",
    vendor: "Atlys",
    approvedBy: "Bandhan",
    finalResult: "Process not Started",
    visaFees: 15000,
    docSigned: "Not Sent",
  },
  {
    name: "Isabella Fontaine",
    email: "isabella.fontaine@example.com",
    country: "United Kingdom",
    visaType: "UK VISA",
    vendor: "MMT",
    approvedBy: "Himanshu",
    interviewRequired: true,
    interviewStatus: "Interview Over",
    finalResult: "VISA Granted",
    interviewDate: "2025-07-31",
    interviewLocation: "Delhi",
    validFrom: "2025-08-01",
    validTo: "2026-02-01",
    visaFees: 15500,
    docSigned: "Not Sent",
  },
  {
    name: "James Okafor",
    email: "james.okafor@example.com",
    country: "United Kingdom",
    visaType: "UK VISA",
    vendor: "MMT",
    approvedBy: "Himanshu",
    interviewRequired: true,
    interviewStatus: "Interview Date Announced",
    finalResult: "Process not Started",
    interviewDate: "2025-09-15",
    interviewLocation: "Mumbai",
    visaFees: 15500,
    docSigned: "Not Sent",
  },
  {
    name: "Mia Larsen",
    email: "mia.larsen@example.com",
    country: "Australia",
    visaType: "AUS VISA",
    vendor: "MMT",
    approvedBy: "Himanshu",
    finalResult: "VISA Granted",
    validFrom: "2025-08-12",
    validTo: "2028-08-12",
    visaFees: 13500,
    flightCost: 41200,
    stayDays: 14,
    docSigned: "Sent & Signed",
  },
  {
    name: "Ethan Brooks",
    email: "ethan.brooks@example.com",
    country: "United States",
    visaType: "B1/B2 VISA",
    vendor: "Rahul",
    approvedBy: "Himanshu",
    formRequired: true,
    formName: "DS 160",
    biometricRequired: false,
    interviewRequired: true,
    formFillup: "Not Filled",
    formSubmission: "No",
    interviewStatus: "Interview Over",
    finalResult: "VISA Granted",
    interviewDate: "2025-10-17",
    interviewLocation: "Chennai",
    vendorFees: 25000,
    visaFees: 16095,
    flightCost: 37060,
    docSigned: "Not Sent",
  },
];

function seedApplications() {
  const existing = db.select({ id: visaApplications.id }).from(visaApplications).all();
  if (existing.length > 0 && !fresh) {
    console.log(`↷ ${existing.length} applications already present — skipping sample insert (use --fresh to reseed).`);
    return;
  }
  for (const s of samples) {
    db.insert(visaApplications).values(s).run();
  }
  console.log(`✓ Inserted ${samples.length} fictional sample applications.`);
}

function main() {
  if (fresh) {
    db.delete(visaApplications).run();
    db.delete(optionPresets).run();
    console.log("✓ Wiped existing data (--fresh).");
  }
  seedPresets();
  console.log("✓ Seeded default combobox presets.");
  seedApplications();
  console.log("Done.");
}

main();
