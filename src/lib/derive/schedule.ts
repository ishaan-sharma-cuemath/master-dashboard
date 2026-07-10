import { differenceInCalendarDays } from "date-fns";
import type { StageRow } from "../db/schema";
import { getCurrentStage } from "./progress";
import type { DisplayHealth, ScheduleSignal } from "./types";

export const DUE_SOON_DAYS = 7;

/**
 * The objective schedule read, derived from stage target dates.
 * It never overrides human-reported health — it sits beside it,
 * which is exactly how watermelons get caught.
 */
export function getScheduleSignal(
  stages: StageRow[],
  now: Date,
): { signal: ScheduleSignal; daysBehind: number } {
  const current = getCurrentStage(stages);
  if (!current?.targetDate) return { signal: "none", daysBehind: 0 };
  const delta = differenceInCalendarDays(now, new Date(current.targetDate));
  if (delta > 0) return { signal: "slipping", daysBehind: delta };
  if (delta >= -DUE_SOON_DAYS) return { signal: "due_soon", daysBehind: 0 };
  return { signal: "none", daysBehind: 0 };
}

/** Reports green while measurably behind its stage plan: green outside, red inside. */
export function isWatermelon(displayHealth: DisplayHealth, signal: ScheduleSignal): boolean {
  return displayHealth.kind === "rag" && displayHealth.health === "on_track" && signal === "slipping";
}
