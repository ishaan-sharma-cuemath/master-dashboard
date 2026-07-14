import type {
  Health,
  PersonRow,
  ProjectRow,
  StageRow,
  StatusUpdateRow,
  TagRow,
} from "../db/schema";

export type Staleness = "exempt" | "fresh" | "aging" | "stale";

export type DisplayHealth =
  | { kind: "rag"; health: Health; ring: "solid" | "dashed" }
  | { kind: "stale" }
  | { kind: "neutral" }
  | { kind: "completed" }
  | { kind: "cancelled" };

export type ScheduleSignal = "slipping" | "due_soon" | "none";

/** The view-model every surface renders from. */
export type DerivedProject = ProjectRow & {
  stages: StageRow[];
  tags: TagRow[];
  lead: PersonRow;
  latestUpdate: StatusUpdateRow | null;
  displayHealth: DisplayHealth;
  staleness: Staleness;
  /** 0–100 */
  progressPct: number;
  currentStage: StageRow | null;
  scheduleSignal: ScheduleSignal;
  daysBehind: number;
  isWatermelon: boolean;
  daysSinceUpdate: number | null;
  /** Current stage label — the portal's reported stage when it reports up, else the local stage. */
  stageLabel: string;
  /** Live status pulled from the project's own portal; null when it doesn't report up. */
  portal: {
    summary: string | null;
    stage: string | null;
    checkedAt: string | null;
    fresh: boolean;
  } | null;
};
