import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { folders, people, projects, projectStatus, type StatusSegment } from "./schema";

export const VISA_DASHBOARD_URL = "https://visa-dashboard-gl1r.onrender.com";

// Sample breakdown for the Visa Dashboard so its page shows real content out of the box.
// Stored as a STATIC cached snapshot (no live endpoint, no network fetch) — replaced the
// moment the real Visa portal exposes GET /api/status and gets connected.
const VISA_SAMPLE = {
  status: "warn" as const,
  summary: "34 granted · 3 rejected · 6 in progress (37 of 43 decided)",
  metricLabel: "Granted",
  metricValue: 34,
  metricTarget: 43,
  metricUnit: "people",
  segments: [
    { label: "Granted", value: 34 },
    { label: "Rejected", value: 3 },
    { label: "In progress", value: 6 },
  ] as StatusSegment[],
  stageCounts: [
    { label: "Submission", value: 3 },
    { label: "Biometric", value: 2 },
    { label: "Consulate interview", value: 1 },
    { label: "Granted", value: 34 },
    { label: "Rejected", value: 3 },
  ] as StatusSegment[],
};

function seedVisaSnapshot(db: BetterSQLite3Database<typeof schema>, projectId: string) {
  const now = new Date().toISOString();
  db.insert(projectStatus)
    .values({
      projectId,
      status: VISA_SAMPLE.status,
      progress: null,
      stage: null,
      summary: VISA_SAMPLE.summary,
      metricLabel: VISA_SAMPLE.metricLabel,
      metricValue: VISA_SAMPLE.metricValue,
      metricTarget: VISA_SAMPLE.metricTarget,
      metricUnit: VISA_SAMPLE.metricUnit,
      segments: VISA_SAMPLE.segments,
      stageCounts: VISA_SAMPLE.stageCounts,
      rawJson: null,
      portalUpdatedAt: now,
      lastCheckedAt: now,
      lastSuccessAt: now,
      consecutiveFailures: 0,
    })
    .onConflictDoUpdate({
      target: projectStatus.projectId,
      set: {
        summary: VISA_SAMPLE.summary,
        segments: VISA_SAMPLE.segments,
        stageCounts: VISA_SAMPLE.stageCounts,
        status: VISA_SAMPLE.status,
        lastSuccessAt: now,
        lastCheckedAt: now,
      },
    })
    .run();
}

/**
 * First-boot seed (runs after migration). Creates the starter workspace on a fresh
 * database, and self-heals the Visa project on existing ones so its page is never empty.
 */
export function ensureBootstrap(db: BetterSQLite3Database<typeof schema>): void {
  const fresh = db.select().from(people).limit(1).all().length === 0;

  if (fresh) {
    const akash = db.insert(people).values({ name: "Akash" }).returning().get();
    db.insert(folders).values({ name: "Unsorted", isSystem: "unsorted", sortOrder: 98 }).run();
    db.insert(folders).values({ name: "Archive", isSystem: "archive", sortOrder: 99 }).run();
    const internal = db
      .insert(folders)
      .values({ name: "Internal Tools", color: "#8b5cf6", sortOrder: 0 })
      .returning()
      .get();

    // Pipeline tracker (many applicants across stages), not a linear project.
    const visa = db
      .insert(projects)
      .values({
        name: "Visa Dashboard",
        description:
          "Tracks Cuemath employees' US visa applications: submission, biometric, consulate interview, and final result across everyone in flight.",
        shape: "pipeline",
        folderId: internal.id,
        leadId: akash.id,
        lifecycle: "in_progress",
        externalLinks: [{ label: "Open Visa Dashboard", url: VISA_DASHBOARD_URL }],
      })
      .returning()
      .get();
    seedVisaSnapshot(db, visa.id);
    return;
  }

  // Existing DB: retire the fragile self-fetch endpoint and make sure the Visa page has
  // cached content. Leaves a real connected endpoint untouched.
  const visa = db.select().from(projects).where(eq(projects.name, "Visa Dashboard")).get();
  if (!visa) return;
  if (visa.statusEndpoint === "/api/status-example") {
    db.update(projects).set({ statusEndpoint: null }).where(eq(projects.id, visa.id)).run();
  }
  if (!visa.statusEndpoint || visa.statusEndpoint === "/api/status-example") {
    const snap = db.select().from(projectStatus).where(eq(projectStatus.projectId, visa.id)).get();
    if (!snap || !snap.lastSuccessAt) seedVisaSnapshot(db, visa.id);
  }
}
