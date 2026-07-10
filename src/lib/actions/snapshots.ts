import type { db } from "@/lib/db/client";
import { progressSnapshots, stages } from "@/lib/db/schema";
import { snapshotValues } from "@/lib/derive";
import { eq } from "drizzle-orm";

/** The synchronous transaction handle better-sqlite3 drizzle passes to db.transaction callbacks. */
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Append a progress_snapshots row reflecting the project's stages AS THEY ARE
 * inside the given transaction. Every stage-touching mutation calls this last,
 * so the burn-up chart is a faithful step history of scope + completed.
 * Internal helper — NOT a server action.
 */
export function appendSnapshot(tx: Tx, projectId: string): void {
  const stageRows = tx.select().from(stages).where(eq(stages.projectId, projectId)).all();
  const values = snapshotValues(stageRows);
  tx.insert(progressSnapshots).values({ projectId, ...values }).run();
}
