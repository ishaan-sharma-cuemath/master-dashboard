"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { projects } from "@/lib/db/schema";
import { sendStatusRequestEmail } from "@/lib/email";

const nowIso = () => new Date().toISOString();

/** Flag a project for attention (or clear the flag). */
export async function toggleFlag(projectId: string, on: boolean, note?: string): Promise<{ ok: true }> {
  const id = z.string().min(1).parse(projectId);
  db.update(projects)
    .set({
      flagged: on,
      flagNote: on ? note?.trim() || null : null,
      flaggedAt: on ? nowIso() : null,
      updatedAt: nowIso(),
    })
    .where(eq(projects.id, id))
    .run();
  revalidatePath("/");
  revalidatePath(`/projects/${id}`);
  return { ok: true };
}

/** Set/update the project owner's contact (used for status-request emails). */
export async function setOwner(projectId: string, name: string, email: string): Promise<{ ok: true }> {
  const id = z.string().min(1).parse(projectId);
  db.update(projects)
    .set({ ownerName: name.trim() || null, ownerEmail: email.trim() || null, updatedAt: nowIso() })
    .where(eq(projects.id, id))
    .run();
  revalidatePath("/");
  revalidatePath(`/projects/${id}`);
  return { ok: true };
}

export type RequestStatusResult = { ok: true; emailed: boolean; reason?: string };

/** Record a status request and email the project owner. */
export async function requestStatus(projectId: string): Promise<RequestStatusResult> {
  const id = z.string().min(1).parse(projectId);
  const project = db.select().from(projects).where(eq(projects.id, id)).get();
  if (!project) return { ok: true, emailed: false, reason: "Project not found." };

  db.update(projects).set({ statusRequestedAt: nowIso(), updatedAt: nowIso() }).where(eq(projects.id, id)).run();

  let emailed = false;
  let reason: string | undefined;
  if (project.ownerEmail) {
    const base = process.env.AUTH_URL ?? "";
    const res = await sendStatusRequestEmail({
      to: project.ownerEmail,
      ownerName: project.ownerName,
      projectName: project.name,
      projectUrl: base ? `${base}/projects/${id}` : undefined,
    });
    emailed = res.sent;
    reason = res.reason;
  } else {
    reason = "No owner email set — add one to email the owner automatically.";
  }

  revalidatePath("/");
  revalidatePath(`/projects/${id}`);
  return { ok: true, emailed, reason };
}

/** Clear a pending status request (e.g. once the owner has updated their portal). */
export async function clearStatusRequest(projectId: string): Promise<{ ok: true }> {
  const id = z.string().min(1).parse(projectId);
  db.update(projects).set({ statusRequestedAt: null, updatedAt: nowIso() }).where(eq(projects.id, id)).run();
  revalidatePath("/");
  revalidatePath(`/projects/${id}`);
  return { ok: true };
}
