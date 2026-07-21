export type Stat = { label: string; value: string | number; tone?: "green" | "red" | "amber" | "accent" };

const toneColor: Record<NonNullable<Stat["tone"]>, string> = {
  green: "var(--health-green-text)",
  red: "var(--health-red-text)",
  amber: "var(--health-amber-text)",
  accent: "var(--accent)",
};

/** A row of KPI stat tiles for the project dashboard. */
export function StatTiles({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((s) => (
        <div key={s.label} className="card px-4 py-3">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.07em]" style={{ color: "var(--ink-muted)" }}>
            {s.label}
          </div>
          <div
            className="mt-1.5 font-mono text-[26px] font-medium leading-none tabular-nums"
            style={{ color: s.tone ? toneColor[s.tone] : "var(--ink)" }}
          >
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}
