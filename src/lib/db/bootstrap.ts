import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { folders, people, projects } from "./schema";

export const VISA_DASHBOARD_URL = "https://visa-dashboard-gl1r.onrender.com";
// Relative → resolves to the app's own /api/status-example on any host. Sample data
// so the Visa page shows a live breakdown until its real portal exposes /api/status.
const SAMPLE_STATUS_ENDPOINT = "/api/status-example";

/**
 * First-boot seed (runs after migration). Creates the starter workspace on a fresh
 * database, and self-heals the Visa project's status endpoint on existing ones so
 * its page is never empty.
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

    // The Visa Dashboard is a PIPELINE tracker (many applicants across stages), not a
    // linear project, so no stages or fake %. Its status is reported up by its portal.
    db.insert(projects)
      .values({
        name: "Visa Dashboard",
        description:
          "Tracks Cuemath employees' US visa applications: submission, biometric, consulate interview, and final result across everyone in flight.",
        shape: "pipeline",
        folderId: internal.id,
        leadId: akash.id,
        lifecycle: "in_progress",
        statusEndpoint: SAMPLE_STATUS_ENDPOINT,
        externalLinks: [{ label: "Open Visa Dashboard", url: VISA_DASHBOARD_URL }],
      })
      .run();
    return;
  }

  // Existing DB: make sure the Visa project reports something (sample) if nothing is wired.
  const visa = db.select().from(projects).where(eq(projects.name, "Visa Dashboard")).get();
  if (visa && !visa.statusEndpoint) {
    db.update(projects).set({ shape: "pipeline", statusEndpoint: SAMPLE_STATUS_ENDPOINT }).where(eq(projects.id, visa.id)).run();
  }
}
