import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import { snapshotValues } from "../derive";
import * as schema from "./schema";
import { folders, people, progressSnapshots, projects, stages, type StageState } from "./schema";

export const VISA_DASHBOARD_URL = "https://visa-dashboard-gl1r.onrender.com";

/**
 * First-boot seed. Runs after migration; only fires on a truly fresh database
 * (no people yet) — e.g. a newly-mounted Render disk. It's a no-op on any DB
 * that already has data, so it never clobbers what the user has added.
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

  const project = db
    .insert(projects)
    .values({
      name: "Visa Dashboard",
      description:
        "Tracks Cuemath employees' US visa applications end to end — submission, biometric appointment, consulate interview, and final result.",
      folderId: internal.id,
      leadId: akash.id,
      lifecycle: "in_progress",
      externalLinks: [{ label: "Open Visa Dashboard", url: VISA_DASHBOARD_URL }],
    })
    .returning()
    .get();

  const stageDefs: { name: string; state: StageState }[] = [
    { name: "Application Submission", state: "done" },
    { name: "Biometric Interview", state: "done" },
    { name: "Consulate Interview", state: "current" },
    { name: "Final Result", state: "pending" },
  ];
  const now = new Date().toISOString();
  stageDefs.forEach((s, i) =>
    db
      .insert(stages)
      .values({
        projectId: project.id,
        name: s.name,
        sortOrder: i,
        ownerId: akash.id,
        state: s.state,
        completedAt: s.state === "done" ? now : null,
      })
      .run(),
  );

  const all = db.select().from(stages).where(eq(stages.projectId, project.id)).all();
  db.insert(progressSnapshots).values({ projectId: project.id, ...snapshotValues(all) }).run();
}
