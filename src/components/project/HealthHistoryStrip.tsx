import type { StatusUpdateRow } from "@/lib/db/schema";
import { fmtDateTime } from "@/lib/format";

const HEALTH_VAR = {
  on_track: "var(--health-green)",
  at_risk: "var(--health-amber)",
  off_track: "var(--health-red)",
} as const;

const HEALTH_WORD = {
  on_track: "On track",
  at_risk: "At risk",
  off_track: "Off track",
} as const;

/** Equal-width cells, one per status update in chronological order — the project's health timeline at a glance. */
export function HealthHistoryStrip({ updates }: { updates: StatusUpdateRow[] }) {
  if (updates.length === 0) return null;
  return (
    <div>
      <div className="flex w-full gap-[2px]" style={{ height: 8 }} role="img" aria-label={`Health history, ${updates.length} updates`}>
        {updates.map((u) => {
          const excerpt = u.note.length > 60 ? `${u.note.slice(0, 60)}…` : u.note;
          return (
            <div
              key={u.id}
              className="flex-1 rounded-[2px] first:rounded-l-[4px] last:rounded-r-[4px]"
              style={{ background: HEALTH_VAR[u.health] ?? "var(--health-stale)" }}
              title={`${fmtDateTime(u.createdAt)} · ${HEALTH_WORD[u.health]} — ${excerpt}`}
            />
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[10px]" style={{ color: "var(--ink-muted)" }}>
        <span>{fmtDateTime(updates[0].createdAt)}</span>
        <span>{fmtDateTime(updates[updates.length - 1].createdAt)}</span>
      </div>
    </div>
  );
}
