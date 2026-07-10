import type { DerivedProject, DisplayHealth } from "./types";

/**
 * Fires first, then smoke, then silence, then calm.
 * Never alphabetical — a portfolio list sorted A→Z hides the fire on page two.
 */
export function needsAttentionRank(dh: DisplayHealth): number {
  switch (dh.kind) {
    case "rag":
      return dh.health === "off_track" ? 0 : dh.health === "at_risk" ? 1 : 3;
    case "stale":
      return 2;
    case "neutral":
      return 4;
    case "completed":
      return 5;
    case "cancelled":
      return 6;
  }
}

export function needsAttentionSort(projects: DerivedProject[]): DerivedProject[] {
  return [...projects].sort((a, b) => {
    const dr = needsAttentionRank(a.displayHealth) - needsAttentionRank(b.displayHealth);
    if (dr !== 0) return dr;
    // Oldest update first — the longest-unheard-from is the most urgent within a band.
    const aT = a.latestUpdate?.createdAt ?? "";
    const bT = b.latestUpdate?.createdAt ?? "";
    return aT.localeCompare(bT);
  });
}

/** Projects that belong in the pinned "Needs attention" section. */
export function needsAttention(p: DerivedProject): boolean {
  const r = needsAttentionRank(p.displayHealth);
  return r <= 2 || p.isWatermelon;
}
