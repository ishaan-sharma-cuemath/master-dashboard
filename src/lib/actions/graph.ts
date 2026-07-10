"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { projects } from "@/lib/db/schema";

const pinSchema = z.object({
  projectId: z.string().min(1),
  x: z.number().finite(),
  y: z.number().finite(),
});

/**
 * Persist a dragged node's resting position. Deliberately NO revalidatePath:
 * pin coordinates don't change any server-rendered HTML worth thrashing over —
 * the client already has the node where the user left it.
 */
export async function pinGraphPosition(projectId: string, x: number, y: number) {
  const parsed = pinSchema.parse({ projectId, x, y });
  db.update(projects)
    .set({ graphX: parsed.x, graphY: parsed.y })
    .where(eq(projects.id, parsed.projectId))
    .run();
}

/** Clear every pinned position — the graph re-simulates from scratch on reload. */
export async function clearGraphPins() {
  db.update(projects).set({ graphX: null, graphY: null }).run();
}
