import type { Lifecycle, StatusUpdateRow } from "../db/schema";
import type { DisplayHealth, Staleness } from "./types";

/**
 * Health is NEVER computed — it is the latest written update's value,
 * overlaid by staleness. A stale project shows gray no matter how green
 * its last report was: old news is not news.
 */
export function getDisplayHealth(
  lifecycle: Lifecycle,
  latestUpdate: StatusUpdateRow | null,
  staleness: Staleness,
): DisplayHealth {
  if (lifecycle === "completed") return { kind: "completed" };
  if (lifecycle === "cancelled") return { kind: "cancelled" };
  if (lifecycle !== "in_progress") return { kind: "neutral" };
  if (staleness === "stale" || latestUpdate === null) return { kind: "stale" };
  return {
    kind: "rag",
    health: latestUpdate.health,
    ring: staleness === "aging" ? "dashed" : "solid",
  };
}
