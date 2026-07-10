import { differenceInCalendarDays } from "date-fns";
import type { Lifecycle } from "../db/schema";
import type { Staleness } from "./types";

export const AGING_GRACE_DAYS = 3;

/**
 * The staleness decay ladder.
 * fresh → aging (dashed ring) past cadence → stale (gray dot, "Awaiting update")
 * past cadence + 3d. Non-in-progress lifecycles are exempt — an on-hold project
 * is supposed to be quiet.
 */
export function getStaleness(
  lastUpdateAt: string | null,
  cadenceDays: number,
  lifecycle: Lifecycle,
  now: Date,
): Staleness {
  if (lifecycle !== "in_progress") return "exempt";
  if (!lastUpdateAt) return "stale";
  const days = differenceInCalendarDays(now, new Date(lastUpdateAt));
  if (days <= cadenceDays) return "fresh";
  if (days <= cadenceDays + AGING_GRACE_DAYS) return "aging";
  return "stale";
}

export function daysSince(iso: string | null, now: Date): number | null {
  return iso === null ? null : differenceInCalendarDays(now, new Date(iso));
}
