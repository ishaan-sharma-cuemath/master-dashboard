"use client";

import { HealthPicker } from "@/components/project/HealthPicker";
import { createStatusUpdate } from "@/lib/actions/updates";
import type { Health, PersonRow, StageRow } from "@/lib/db/schema";
import { Send } from "lucide-react";
import { useState, useTransition } from "react";

/**
 * Post a status update: pick health against the written criteria, write the note,
 * optionally check off stages completed since last update. Amber/red demand a
 * road-to-green action + owner.
 */
export function UpdateComposer({
  projectId,
  people,
  stages,
}: {
  projectId: string;
  people: PersonRow[];
  stages: StageRow[];
}) {
  const [health, setHealth] = useState<Health | null>(null);
  const [note, setNote] = useState("");
  const [rtgAction, setRtgAction] = useState("");
  const [rtgOwnerId, setRtgOwnerId] = useState("");
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const eligibleStages = stages
    .filter((s) => s.state === "current" || s.state === "pending")
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const needsRtg = health !== null && health !== "on_track";
  const canSubmit = health !== null && note.trim().length >= 3 && (!needsRtg || rtgAction.trim().length > 0);

  const toggleStage = (id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = () => {
    if (!canSubmit || health === null) return;
    setError(null);
    startTransition(async () => {
      const res = await createStatusUpdate({
        projectId,
        health,
        note: note.trim(),
        roadToGreenAction: needsRtg ? rtgAction.trim() : undefined,
        roadToGreenOwnerId: needsRtg && rtgOwnerId ? rtgOwnerId : undefined,
        completedStageIds: completed.size > 0 ? [...completed] : undefined,
      });
      if (res.ok) {
        setHealth(null);
        setNote("");
        setRtgAction("");
        setRtgOwnerId("");
        setCompleted(new Set());
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <section className="card p-5">
      <div className="microlabel">Post update</div>

      <div className="mt-3">
        <HealthPicker value={health} onChange={setHealth} disabled={pending} />
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        disabled={pending}
        rows={3}
        placeholder="What happened since the last update?"
        className="mt-3 w-full resize-y rounded-[8px] border px-3 py-2 text-[13.5px] leading-relaxed outline-none transition-colors placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] disabled:opacity-60"
        style={{ borderColor: "var(--line)", background: "var(--surface-raised)", color: "var(--ink)" }}
      />

      {needsRtg && (
        <div className="mt-2 rounded-[8px] border p-3" style={{ borderColor: "var(--line)", background: "var(--health-amber-soft)" }}>
          <label className="microlabel" htmlFor="rtg-action" style={{ color: "var(--health-amber-text)" }}>
            Road to green — required
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              id="rtg-action"
              value={rtgAction}
              onChange={(e) => setRtgAction(e.target.value)}
              disabled={pending}
              placeholder="The one action that gets this back on track"
              className="min-w-0 flex-1 rounded-[8px] border px-3 py-1.5 text-[13px] outline-none transition-colors placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] disabled:opacity-60"
              style={{ borderColor: "var(--line)", background: "var(--surface-raised)", color: "var(--ink)" }}
            />
            <select
              value={rtgOwnerId}
              onChange={(e) => setRtgOwnerId(e.target.value)}
              disabled={pending}
              aria-label="Road to green owner"
              className="rounded-[8px] border px-2.5 py-1.5 text-[13px] outline-none transition-colors focus:border-[var(--accent)] disabled:opacity-60"
              style={{ borderColor: "var(--line)", background: "var(--surface-raised)", color: rtgOwnerId ? "var(--ink)" : "var(--ink-muted)" }}
            >
              <option value="">Owner…</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {eligibleStages.length > 0 && (
        <fieldset className="mt-3">
          <legend className="microlabel">Completed with this update</legend>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
            {eligibleStages.map((s) => (
              <label
                key={s.id}
                className="flex cursor-pointer items-center gap-1.5 text-[13px]"
                style={{ color: completed.has(s.id) ? "var(--ink)" : "var(--ink-secondary)" }}
              >
                <input
                  type="checkbox"
                  checked={completed.has(s.id)}
                  onChange={() => toggleStage(s.id)}
                  disabled={pending}
                  className="h-3.5 w-3.5 accent-[var(--accent)]"
                />
                {s.name}
                {s.state === "current" && (
                  <span className="font-mono text-[10px]" style={{ color: "var(--accent)" }}>
                    current
                  </span>
                )}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit || pending}
          className="inline-flex items-center gap-1.5 rounded-[8px] px-3.5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: "var(--accent)" }}
        >
          <Send size={13} strokeWidth={2} />
          {pending ? "Posting…" : "Post update"}
        </button>
        {error && (
          <span className="text-[12.5px]" style={{ color: "var(--health-red-text)" }}>
            {error}
          </span>
        )}
        {!error && health === null && (
          <span className="text-[12.5px]" style={{ color: "var(--ink-muted)" }}>
            Pick a health first.
          </span>
        )}
      </div>
    </section>
  );
}
