"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { projects } from "@/lib/db/schema";

const nowIso = () => new Date().toISOString();

/** Flag a project for attention (or clear the flag). */
export async function toggleFlag(projectId: string, on: boolean, note?: string): Promise<{ ok: true }> {
  const id = z.string().min(1).parse(projectId);
  db.update(projects)
    .set({
      flagged: on,
      flagNote: on ? (note?.trim() || null) : null,
      flaggedAt: on ? nowIso() : null,
      updatedAt: nowIso(),
    })
    .where(eq(projects.id, id))
    .run();
  revalidatePath("/");
  revalidatePath(`/projects/${id}`);
  return { ok: true };
}

/** Ask the project's owner for a status update (records the request; clears any prior flag-note nudge). */
export async function requestStatus(projectId: string): Promise<{ ok: true }> {
  const id = z.string().min(1).parse(projectId);
  db.update(projects)
    .set({ statusRequestedAt: nowIso(), updatedAt: nowIso() })
    .where(eq(projects.id, id))
    .run();
  revalidatePath("/");
  revalidatePath(`/projects/${id}`);
  return { ok: true };
}

/** Clear a pending status request (e.g. once the owner has updated their portal). */
export async function clearStatusRequest(projectId: string): Promise<{ ok: true }> {
  const id = z.string().min(1).parse(projectId);
  db.update(projects).set({ statusRequestedAt: null, updatedAt: nowIso() }).where(eq(projects.id, id)).run();
  revalidatePath("/");
  revalidatePath(`/projects/${id}`);
  return { ok: true };
}
