import type { StageRow } from "../db/schema";

/** Done stages count fully, the current stage counts half. 0 with no stages. */
export function getProgress(stages: StageRow[]): number {
  const total = stages.reduce((s, st) => s + st.weight, 0);
  if (total === 0) return 0;
  const completed = stages.reduce(
    (s, st) => s + (st.state === "done" ? st.weight : st.state === "current" ? st.weight * 0.5 : 0),
    0,
  );
  return completed / total;
}

/** The explicit `current` stage; else the first non-done stage in order; else null. */
export function getCurrentStage(stages: StageRow[]): StageRow | null {
  const ordered = [...stages].sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    ordered.find((s) => s.state === "current") ??
    ordered.find((s) => s.state === "blocked") ??
    ordered.find((s) => s.state === "pending") ??
    null
  );
}

/** Single source for every ProgressSnapshot writer. */
export function snapshotValues(stages: StageRow[]): {
  scopeTotal: number;
  completed: number;
  stageIndex: number;
} {
  const ordered = [...stages].sort((a, b) => a.sortOrder - b.sortOrder);
  const scopeTotal = ordered.reduce((s, st) => s + st.weight, 0);
  const completed = ordered.reduce(
    (s, st) => s + (st.state === "done" ? st.weight : st.state === "current" ? st.weight * 0.5 : 0),
    0,
  );
  const current = getCurrentStage(ordered);
  const stageIndex = current ? ordered.indexOf(current) : ordered.length;
  return { scopeTotal, completed, stageIndex };
}
