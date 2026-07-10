import type { StageRow } from "@/lib/db/schema";

/**
 * Segmented stage bar — one segment per stage.
 * done = green · current = accent (half-filled) · blocked = amber · pending = hairline.
 * Merges "how far along" and "where exactly" into one 4px glyph.
 */
export function StageBar({ stages, height = 4 }: { stages: StageRow[]; height?: number }) {
  if (stages.length === 0) {
    return <div className="w-full rounded-full" style={{ height, background: "var(--line)" }} />;
  }
  return (
    <div className="flex w-full gap-[2px]" style={{ height }} title={`${stages.length} stages`}>
      {stages.map((s) => (
        <div
          key={s.id}
          className="flex-1 first:rounded-l-full last:rounded-r-full overflow-hidden"
          style={{
            background:
              s.state === "done"
                ? "var(--health-green)"
                : s.state === "blocked"
                  ? "var(--health-amber)"
                  : "var(--line)",
          }}
        >
          {s.state === "current" && (
            <div className="h-full w-[55%]" style={{ background: "var(--ink-secondary)" }} />
          )}
        </div>
      ))}
    </div>
  );
}
