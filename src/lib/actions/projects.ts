"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db/client";
import {
  folders,
  HEALTHS,
  people,
  progressSnapshots,
  projects,
  projectTags,
  relations,
  SHAPES,
  stages,
  statusUpdates,
  type StageRow,
} from "@/lib/db/schema";
import { snapshotValues } from "@/lib/derive";

/* ————— input schemas ————— */

const ymd = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
  .nullish();

const stageInput = z.object({
  name: z.string().trim().min(1, "Stage name required"),
  ownerId: z.string().nullish(),
  targetDate: ymd,
});

const linkInput = z.object({
  label: z.string().trim(),
  url: z.url("Invalid URL"),
});

const createProjectInput = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  description: z.string().default(""),
  shape: z.enum(SHAPES).default("linear"),
  folderId: z.string().nullish(),
  leadId: z.string().nullish(),
  ownerName: z.string().nullish(),
  ownerEmail: z.string().nullish(),
  startDate: ymd,
  targetDate: ymd,
  tagIds: z.array(z.string()).default([]),
  stages: z.array(stageInput).default([]),
  externalLinks: z.array(linkInput).default([]),
  relatedProjectIds: z.array(z.string()).default([]),
  initialHealth: z.enum(HEALTHS).nullish(),
  initialNote: z.string().default(""),
});

export type CreateProjectInput = z.input<typeof createProjectInput>;

/* ————— defaults (single-user mode) ————— */

/** The acting person is the seeded "Akash"; fall back to the first person. */
function resolveActor(preferredId?: string | null) {
  if (preferredId) {
    const byId = db.select().from(people).where(eq(people.id, preferredId)).get();
    if (byId) return byId;
  }
  const akash = db.select().from(people).where(eq(people.name, "Akash")).get();
  const actor = akash ?? db.select().from(people).limit(1).get();
  if (!actor) throw new Error("No people exist — seed the database first.");
  return actor;
}

function resolveFolder(preferredId?: string | null) {
  if (preferredId) {
    const byId = db.select().from(folders).where(eq(folders.id, preferredId)).get();
    if (byId) return byId;
  }
  const unsorted = db.select().from(folders).where(eq(folders.isSystem, "unsorted")).get();
  const folder = unsorted ?? db.select().from(folders).limit(1).get();
  if (!folder) throw new Error("No folders exist — seed the database first.");
  return folder;
}

/* ————— actions ————— */

export async function createProject(raw: CreateProjectInput): Promise<{ id: string }> {
  const parsed = createProjectInput.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }
  const input = parsed.data;

  const lead = resolveActor(input.leadId);
  const folder = resolveFolder(input.folderId);
  // Pipelines/metrics are active by nature; a linear project is planned until it has stages.
  const lifecycle =
    input.stages.length > 0 || input.shape !== "linear" ? ("in_progress" as const) : ("planned" as const);

  const id = db.transaction((tx) => {
    const project = tx
      .insert(projects)
      .values({
        name: input.name,
        description: input.description,
        shape: input.shape,
        folderId: folder.id,
        leadId: lead.id,
        ownerName: input.ownerName?.trim() || null,
        ownerEmail: input.ownerEmail?.trim() || null,
        lifecycle,
        startDate: input.startDate ?? null,
        targetDate: input.targetDate ?? null,
        externalLinks: input.externalLinks.filter((l) => l.url.length > 0),
      })
      .returning()
      .get();

    // Stages: first is 'current', owners default to the lead.
    const stageRows: StageRow[] = input.stages.map((s, i) =>
      tx
        .insert(stages)
        .values({
          projectId: project.id,
          name: s.name,
          sortOrder: i,
          ownerId: s.ownerId || lead.id,
          targetDate: s.targetDate ?? null,
          state: i === 0 ? "current" : "pending",
        })
        .returning()
        .get(),
    );

    for (const tagId of new Set(input.tagIds)) {
      tx.insert(projectTags).values({ projectId: project.id, tagId }).run();
    }

    for (const toId of new Set(input.relatedProjectIds)) {
      if (toId === project.id) continue;
      tx.insert(relations).values({ fromProjectId: project.id, toProjectId: toId, type: "related" }).run();
    }

    if (input.initialHealth) {
      tx.insert(statusUpdates)
        .values({
          projectId: project.id,
          authorId: lead.id,
          health: input.initialHealth,
          note: input.initialNote.trim() || "Project created.",
          currentStageId: stageRows[0]?.id ?? null,
        })
        .run();
    }

    // Baseline snapshot — every project starts with one.
    tx.insert(progressSnapshots)
      .values({ projectId: project.id, ...snapshotValues(stageRows) })
      .run();

    return project.id;
  });

  revalidatePath("/");
  revalidatePath(`/projects/${id}`);
  return { id };
}

/** Minimal quick-create: name only → backlog project in the Unsorted folder. */
export async function quickCreateProject(rawName: string): Promise<{ id: string }> {
  const parsed = z.string().trim().min(2, "Name must be at least 2 characters").safeParse(rawName);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid name");
  }
  const name = parsed.data;

  const lead = resolveActor();
  const folder = resolveFolder();

  const id = db.transaction((tx) => {
    const project = tx
      .insert(projects)
      .values({ name, folderId: folder.id, leadId: lead.id, lifecycle: "backlog" })
      .returning()
      .get();
    tx.insert(progressSnapshots)
      .values({ projectId: project.id, ...snapshotValues([]) })
      .run();
    return project.id;
  });

  revalidatePath("/");
  revalidatePath(`/projects/${id}`);
  return { id };
}
