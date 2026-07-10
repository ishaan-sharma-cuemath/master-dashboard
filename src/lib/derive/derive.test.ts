import { describe, expect, it } from "vitest";
import type { StageRow, StatusUpdateRow } from "../db/schema";
import { getDisplayHealth } from "./health";
import { getCurrentStage, getProgress, snapshotValues } from "./progress";
import { relatednessScore, type RelatednessContext } from "./relatedness";
import { getScheduleSignal, isWatermelon } from "./schedule";
import { getStaleness } from "./staleness";
import { needsAttentionRank } from "./sort";

const NOW = new Date("2026-07-06T12:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();

const stage = (over: Partial<StageRow>): StageRow => ({
  id: over.id ?? crypto.randomUUID(),
  projectId: "p1",
  name: "Stage",
  sortOrder: 0,
  ownerId: "u1",
  targetDate: null,
  weight: 1,
  state: "pending",
  completedAt: null,
  ...over,
});

const update = (over: Partial<StatusUpdateRow>): StatusUpdateRow => ({
  id: crypto.randomUUID(),
  projectId: "p1",
  authorId: "u1",
  createdAt: daysAgo(1),
  health: "on_track",
  note: "",
  roadToGreenAction: null,
  roadToGreenOwnerId: null,
  currentStageId: null,
  autoChanges: [],
  ...over,
});

describe("staleness ladder (cadence 7, grace 3)", () => {
  it("day 7 = fresh, day 8 = aging, day 10 = aging, day 11 = stale", () => {
    expect(getStaleness(daysAgo(7), 7, "in_progress", NOW)).toBe("fresh");
    expect(getStaleness(daysAgo(8), 7, "in_progress", NOW)).toBe("aging");
    expect(getStaleness(daysAgo(10), 7, "in_progress", NOW)).toBe("aging");
    expect(getStaleness(daysAgo(11), 7, "in_progress", NOW)).toBe("stale");
  });
  it("never updated = stale; non-in-progress lifecycles exempt", () => {
    expect(getStaleness(null, 7, "in_progress", NOW)).toBe("stale");
    expect(getStaleness(daysAgo(90), 7, "on_hold", NOW)).toBe("exempt");
    expect(getStaleness(daysAgo(90), 7, "backlog", NOW)).toBe("exempt");
    expect(getStaleness(null, 7, "completed", NOW)).toBe("exempt");
  });
});

describe("display health", () => {
  it("stale grays out even a green report", () => {
    expect(getDisplayHealth("in_progress", update({ health: "on_track" }), "stale")).toEqual({ kind: "stale" });
  });
  it("aging keeps the color but dashes the ring", () => {
    expect(getDisplayHealth("in_progress", update({ health: "at_risk" }), "aging")).toEqual({
      kind: "rag",
      health: "at_risk",
      ring: "dashed",
    });
  });
  it("lifecycle kinds", () => {
    expect(getDisplayHealth("planned", null, "exempt")).toEqual({ kind: "neutral" });
    expect(getDisplayHealth("completed", null, "exempt")).toEqual({ kind: "completed" });
    expect(getDisplayHealth("cancelled", null, "exempt")).toEqual({ kind: "cancelled" });
  });
});

describe("progress", () => {
  it("done counts fully, current counts half", () => {
    const stages = [
      stage({ state: "done", sortOrder: 0 }),
      stage({ state: "current", sortOrder: 1 }),
      stage({ state: "pending", sortOrder: 2 }),
      stage({ state: "pending", sortOrder: 3 }),
    ];
    expect(getProgress(stages)).toBeCloseTo((1 + 0.5) / 4);
  });
  it("zero stages = zero progress, not NaN", () => {
    expect(getProgress([])).toBe(0);
  });
  it("current stage falls back through blocked → pending", () => {
    expect(getCurrentStage([stage({ state: "done" })])).toBeNull();
    const blocked = stage({ state: "blocked", sortOrder: 1 });
    expect(getCurrentStage([stage({ state: "done", sortOrder: 0 }), blocked])).toBe(blocked);
  });
  it("snapshotValues respects weights", () => {
    const s = snapshotValues([
      stage({ state: "done", weight: 2, sortOrder: 0 }),
      stage({ state: "current", weight: 1, sortOrder: 1 }),
      stage({ state: "pending", weight: 1, sortOrder: 2 }),
    ]);
    expect(s).toEqual({ scopeTotal: 4, completed: 2.5, stageIndex: 1 });
  });
});

describe("schedule signal + watermelon", () => {
  it("current stage past target = slipping with daysBehind", () => {
    const stages = [stage({ state: "current", targetDate: daysAgo(12).slice(0, 10) })];
    const { signal, daysBehind } = getScheduleSignal(stages, NOW);
    expect(signal).toBe("slipping");
    expect(daysBehind).toBe(12);
  });
  it("watermelon = on_track AND slipping, nothing else", () => {
    expect(isWatermelon({ kind: "rag", health: "on_track", ring: "solid" }, "slipping")).toBe(true);
    expect(isWatermelon({ kind: "rag", health: "at_risk", ring: "solid" }, "slipping")).toBe(false);
    expect(isWatermelon({ kind: "rag", health: "on_track", ring: "solid" }, "none")).toBe(false);
    expect(isWatermelon({ kind: "stale" }, "slipping")).toBe(false);
  });
});

describe("relatedness scoring (3 / 2 / 1 weights)", () => {
  const ctx: RelatednessContext = {
    relations: new Map([["a", new Set(["b"])]]),
    facetTags: new Map([
      ["a", new Set(["t1", "t2"])],
      ["b", new Set(["t1"])],
    ]),
    people: new Map([
      ["a", new Set(["u1", "u2"])],
      ["b", new Set(["u1"])],
    ]),
  };
  it("sums relation + shared facet tags + shared people", () => {
    expect(relatednessScore("a", "b", ctx)).toBe(3 + 2 + 1);
  });
  it("empty context scores zero", () => {
    expect(relatednessScore("a", "z", ctx)).toBe(0);
  });
});

describe("needs-attention ranking", () => {
  it("red > yellow > stale > green > neutral > done", () => {
    const ranks = [
      needsAttentionRank({ kind: "rag", health: "off_track", ring: "solid" }),
      needsAttentionRank({ kind: "rag", health: "at_risk", ring: "solid" }),
      needsAttentionRank({ kind: "stale" }),
      needsAttentionRank({ kind: "rag", health: "on_track", ring: "solid" }),
      needsAttentionRank({ kind: "neutral" }),
      needsAttentionRank({ kind: "completed" }),
    ];
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    expect(new Set(ranks).size).toBe(ranks.length);
  });
});
