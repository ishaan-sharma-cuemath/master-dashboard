import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { folders, people, projects } from "./schema";

export const VISA_DASHBOARD_URL = "https://visa-dashboard-gl1r.onrender.com";

/**
 * First-boot seed. Runs after migration; only fires on a truly fresh database
 * (no people yet) — e.g. a newly-mounted Render disk. No-op once data exists.
 */
export function ensureBootstrap(db: BetterSQLite3Database<typeof schema>): void {
  const alreadySetUp = db.select().from(people).limit(1).all().length > 0;
  if (alreadySetUp) return;

  const akash = db.insert(people).values({ name: "Akash" }).returning().get();

  db.insert(folders).values({ name: "Unsorted", isSystem: "unsorted", sortOrder: 98 }).run();
  db.insert(folders).values({ name: "Archive", isSystem: "archive", sortOrder: 99 }).run();
  const internal = db
    .insert(folders)
    .values({ name: "Internal Tools", color: "#8b5cf6", sortOrder: 0 })
    .returning()
    .get();

  // The Visa Dashboard is a PIPELINE tracker (many applicants across stages), not a
  // linear project — so no stages / fake %. Its status is reported up by its portal.
  db.insert(projects)
    .values({
      name: "Visa Dashboard",
      description:
        "Tracks Cuemath employees' US visa applications — submission, biometric, consulate interview, and final result across everyone in flight.",
      shape: "pipeline",
      folderId: internal.id,
      leadId: akash.id,
      lifecycle: "in_progress",
      externalLinks: [{ label: "Open Visa Dashboard", url: VISA_DASHBOARD_URL }],
    })
    .run();
}
