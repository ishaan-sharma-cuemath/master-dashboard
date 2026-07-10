"use server";

import { db } from "@/lib/db/client";
import { HEALTHS, people, projects, stages, statusUpdates, type AutoChange } from "@/lib/db/schema";
import { getCurrentStage } from "@/lib/derive";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { appendSnapshot } from "./snapshots";

const createUpdateSchema = z
  .object({
    projectId: z.string().min(1),
    health: z.enum(HEALTHS),
    note: z.string().trim().min(3, "Note needs at least 3 characters."),
    roadToGreenAction: z.string().trim().optional(),
    roadToGreenOwnerId: z.string().optional(),
    completedStageIds: z.array(z.string()).optional(),
  })
  .refine((v) => v.health === "on_track" || (v.roadToGreenAction ?? "").length > 0, {
    message: "A road-to-green action is required when not on track.",
    path: ["roadToGreenAction"],
  });

export type CreateStatusUpdateInput = z.input<typeof createUpdateSchema>;
export type ActionResult = { ok: true } | { ok: false; error: string };

/** Single-user mode: the acting person is the seeded "Akash" (fallback: first person). */
function actingPerson() {
  return (
    db.select().from(people).where(eq(people.name, "Akash")).get() ?? db.select().from(people).get()
  );
}

export async function createStatusUpdate(input: CreateStatusUpdateInput): Promise<ActionResult> {
  const parsed = createUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { projectId, health, note, roadToGreenAction, roadToGreenOwnerId, completedStageIds } =
    parsed.data;

  const author = actingPerson();
  if (!author) return { ok: false, error: "No people exist in this workspace." };

  const project = db.select().from(projects).where(eq(projects.id, projectId)).get();
  if (!project) return { ok: false, error: "Project not found." };

  const now = new Date().toISOString();

  db.transaction((tx) => {
    const projectStages = tx
      .select()
      .from(stages)
      .where(eq(stages.projectId, projectId))
      .all()
      .sort((a, b) => a.sortOrder - b.sortOrder);

    // 1. Mark checked stages done (mutate local copies so derive fns see the new state).
    const toComplete = new Set(completedStageIds ?? []);
    const autoChanges: AutoChange[] = [];
    for (const s of projectStages) {
      if (!toComplete.has(s.id) || s.state === "done") continue;
      tx.update(stages).set({ state: "done", completedAt: now }).where(eq(stages.id, s.id)).run();
      s.state = "done";
      s.completedAt = now;
      autoChanges.push({ kind: "stage_done", detail: `Stage “${s.name}” completed` });
    }

    // 2. If completions left no explicit current stage, promote the next pending one.
    if (autoChanges.length > 0 && !projectStages.some((s) => s.state === "current")) {
      const next = projectStages.find((s) => s.state === "pending");
      if (next) {
        tx.update(stages).set({ state: "current" }).where(eq(stages.id, next.id)).run();
        next.state = "current";
      }
    }

    // 3. Insert the update itself, pinned to whatever stage is now current.
    const current = getCurrentStage(projectStages);
    tx.insert(statusUpdates)
      .values({
        projectId,
        authorId: author.id,
        createdAt: now,
        health,
        note,
        roadToGreenAction: health === "on_track" ? null : (roadToGreenAction ?? null),
        roadToGreenOwnerId: health === "on_track" ? null : roadToGreenOwnerId || null,
        currentStageId: current?.id ?? null,
        autoChanges,
      })
      .run();

    // 4. Snapshot progress + touch the project.
    appendSnapshot(tx, projectId);
    tx.update(projects).set({ updatedAt: now }).where(eq(projects.id, projectId)).run();
  });

  revalidatePath("/");
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}
