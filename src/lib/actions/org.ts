"use server";

import { db } from "@/lib/db/client";
import { tags } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type OrgActionResult = { ok: true } | { ok?: false; error: string };

const renameInput = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2, "Tag name must be at least 2 characters").max(40, "Keep tag names under 40 characters"),
});

function isUniqueViolation(e: unknown): boolean {
  return e instanceof Error && /UNIQUE constraint/i.test(e.message);
}

export async function renameTag(id: string, name: string): Promise<OrgActionResult> {
  const parsed = renameInput.safeParse({ id, name });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid tag name" };
  }

  try {
    const res = db
      .update(tags)
      .set({ name: parsed.data.name })
      .where(eq(tags.id, parsed.data.id))
      .run();
    if (res.changes === 0) return { error: "Tag not found — it may have been deleted." };
  } catch (e) {
    if (isUniqueViolation(e)) return { error: `A tag named “${parsed.data.name}” already exists.` };
    throw e;
  }

  revalidatePath("/tags");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteTag(id: string): Promise<OrgActionResult> {
  const parsed = z.string().min(1).safeParse(id);
  if (!parsed.success) return { error: "Invalid tag id" };

  // project_tags junction rows cascade via FK (onDelete: "cascade", foreign_keys pragma ON).
  const res = db.delete(tags).where(eq(tags.id, parsed.data)).run();
  if (res.changes === 0) return { error: "Tag not found — it may already be deleted." };

  revalidatePath("/tags");
  revalidatePath("/");
  return { ok: true };
}
