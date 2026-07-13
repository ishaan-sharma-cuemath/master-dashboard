"use client";

import { clearStatusRequest, requestStatus, toggleFlag } from "@/lib/actions/oversight";
import { relAge } from "@/lib/format";
import { Bell, BellRing, Flag, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  projectId: string;
  flagged: boolean;
  flagNote: string | null;
  daysSinceRequest: number | null;
};

export function OversightActions({ projectId, flagged, flagNote, daysSinceRequest }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");

  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      await fn();
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-3">
      {/* Current state banners */}
      {flagged && (
        <div
          className="flex items-start gap-2.5 rounded-[10px] px-3.5 py-2.5"
          style={{ background: "var(--health-red-soft)", color: "var(--health-red-text)" }}
        >
          <Flag size={15} strokeWidth={2} className="mt-0.5 shrink-0" fill="currentColor" />
          <div className="min-w-0 flex-1 text-[13px]">
            <span className="font-semibold">Flagged for attention.</span>
            {flagNote && <span> {flagNote}</span>}
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => toggleFlag(projectId, false))}
            className="shrink-0 rounded-[6px] p-0.5 transition-opacity hover:opacity-70"
            title="Clear flag"
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>
      )}

      {daysSinceRequest !== null && (
        <div
          className="flex items-center gap-2.5 rounded-[10px] px-3.5 py-2.5 text-[13px]"
          style={{ background: "var(--health-amber-soft)", color: "var(--health-amber-text)" }}
        >
          <BellRing size={15} strokeWidth={2} className="shrink-0" />
          <span className="flex-1">
            Status requested {relAge(daysSinceRequest)} — awaiting the owner&apos;s update.
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => clearStatusRequest(projectId))}
            className="shrink-0 rounded-[6px] p-0.5 transition-opacity hover:opacity-70"
            title="Clear request"
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2.5">
        {!flagged &&
          (showNote ? (
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                run(() => toggleFlag(projectId, true, note));
                setShowNote(false);
                setNote("");
              }}
            >
              <input
                autoFocus
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What needs attention? (optional)"
                className="h-[34px] w-[260px] rounded-[9px] border px-3 text-[13px] outline-none focus:border-[var(--accent)]"
                style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
              />
              <button
                type="submit"
                disabled={pending}
                className="h-[34px] rounded-[9px] px-3.5 text-[13px] font-semibold text-white"
                style={{ background: "var(--health-red)" }}
              >
                Flag
              </button>
              <button
                type="button"
                onClick={() => setShowNote(false)}
                className="text-[12.5px]"
                style={{ color: "var(--ink-muted)" }}
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => setShowNote(true)}
              className="inline-flex h-[34px] items-center gap-2 rounded-[9px] border px-3.5 text-[13px] font-medium transition-colors hover:border-[var(--line-strong)]"
              style={{ borderColor: "var(--line)", color: "var(--ink)", background: "var(--surface)" }}
            >
              <Flag size={14} strokeWidth={1.9} /> Flag project
            </button>
          ))}

        {daysSinceRequest === null && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => requestStatus(projectId))}
            className="inline-flex h-[34px] items-center gap-2 rounded-[9px] border px-3.5 text-[13px] font-medium transition-colors hover:border-[var(--line-strong)]"
            style={{ borderColor: "var(--line)", color: "var(--ink)", background: "var(--surface)" }}
          >
            <Bell size={14} strokeWidth={1.9} /> Ask for status
          </button>
        )}
      </div>
    </div>
  );
}
