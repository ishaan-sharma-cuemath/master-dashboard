"use server";

import { db } from "@/lib/db/client";
import { projects, STAGE_STATES, stages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { appendSnapshot } from "./snapshots";
import type { ActionResult } from "./updates";

function revalidateProject(projectId: string) {
  revalidatePath("/");
  revalidatePath(`/projects/${projectId}`);
}

/** Mark the current stage done and promote the next pending stage to current. */
export async function advanceStage(projectId: string): Promise<ActionResult> {
  const parsed = z.string().min(1).safeParse(projectId);
  if (!parsed.success) return { ok: false, error: "Invalid project id." };

  const result = db.transaction((tx): ActionResult => {
    const list = tx
      .select()
      .from(stages)
      .where(eq(stages.projectId, parsed.data))
      .all()
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const current = list.find((s) => s.state === "current");
    if (!current) return { ok: false, error: "No current stage to advance." };

    const now = new Date().toISOString();
    tx.update(stages).set({ state: "done", completedAt: now }).where(eq(stages.id, current.id)).run();
    current.state = "done";

    const next = list.find((s) => s.state === "pending");
    if (next) {
      tx.update(stages).set({ state: "current" }).where(eq(stages.id, next.id)).run();
    }

    appendSnapshot(tx, parsed.data);
    tx.update(projects).set({ updatedAt: now }).where(eq(projects.id, parsed.data)).run();
    return { ok: true };
  });

  if (result.ok) revalidateProject(parsed.data);
  return result;
}

const setStateSchema = z.object({
  stageId: z.string().min(1),
  state: z.enum(STAGE_STATES),
});

/** Set a single stage's state directly — includes blocked ↔ current toggling. */
export async function setStageState(stageId: string, state: (typeof STAGE_STATES)[number]): Promise<ActionResult> {
  const parsed = setStateSchema.safeParse({ stageId, state });
  if (!parsed.success) return { ok: false, error: "Invalid stage or state." };

  const projectId = db.transaction((tx): string | null => {
    const stage = tx.select().from(stages).where(eq(stages.id, parsed.data.stageId)).get();
    if (!stage) return null;

    const now = new Date().toISOString();
    tx.update(stages)
      .set({
        state: parsed.data.state,
        completedAt: parsed.data.state === "done" ? now : null,
      })
      .where(eq(stages.id, stage.id))
      .run();

    appendSnapshot(tx, stage.projectId);
    tx.update(projects).set({ updatedAt: now }).where(eq(projects.id, stage.projectId)).run();
    return stage.projectId;
  });

  if (!projectId) return { ok: false, error: "Stage not found." };
  revalidateProject(projectId);
  return { ok: true };
}
