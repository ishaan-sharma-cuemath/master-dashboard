"use client";

import { advanceStage, setStageState } from "@/lib/actions/stages";
import type { StageRow } from "@/lib/db/schema";
import { ChevronRight, OctagonMinus, Play } from "lucide-react";
import { useState, useTransition } from "react";

/**
 * Compact stage controls for the Stages card header:
 * advance the current stage, toggle blocked ↔ current, or start the next pending one.
 */
export function StageRowActions({ projectId, currentStage }: { projectId: string; currentStage: StageRow | null }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!currentStage) return null;

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Something went wrong.");
    });
  };

  const ghost =
    "inline-flex items-center gap-1 rounded-[6px] border px-2 py-1 text-[12px] font-medium transition-colors hover:border-[var(--line-strong)] disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <span className="flex items-center gap-1.5">
      {error && (
        <span className="text-[11.5px]" style={{ color: "var(--health-red-text)" }}>
          {error}
        </span>
      )}

      {currentStage.state === "current" && (
        <>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => setStageState(currentStage.id, "blocked"))}
            title={`Mark “${currentStage.name}” blocked`}
            className={ghost}
            style={{ borderColor: "var(--line)", color: "var(--ink-secondary)" }}
          >
            <OctagonMinus size={12} strokeWidth={2} /> Block
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => advanceStage(projectId))}
            title={`Complete “${currentStage.name}” and move to the next stage`}
            className={ghost}
            style={{ borderColor: "var(--line)", color: "var(--accent)" }}
          >
            {pending ? "Advancing…" : "Advance stage"} <ChevronRight size={12} strokeWidth={2} />
          </button>
        </>
      )}

      {currentStage.state === "blocked" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setStageState(currentStage.id, "current"))}
          title={`Unblock “${currentStage.name}”`}
          className={ghost}
          style={{ borderColor: "var(--line)", color: "var(--health-amber-text)" }}
        >
          <Play size={12} strokeWidth={2} /> Unblock
        </button>
      )}

      {currentStage.state === "pending" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setStageState(currentStage.id, "current"))}
          title={`Start “${currentStage.name}”`}
          className={ghost}
          style={{ borderColor: "var(--line)", color: "var(--accent)" }}
        >
          <Play size={12} strokeWidth={2} /> Start stage
        </button>
      )}
    </span>
  );
}
