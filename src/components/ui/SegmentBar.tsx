type Segment = { label: string; value: number };

/** Map common outcome words to meaningful colors; everything else is neutral. */
function colorFor(label: string): string {
  const l = label.toLowerCase();
  if (/(grant|approv|complet|done|clear|pass|success|won)/.test(l)) return "var(--health-green)";
  if (/(reject|deni|fail|lost|cancel|block)/.test(l)) return "var(--health-red)";
  if (/(risk|hold|pending review|escalat)/.test(l)) return "var(--health-amber)";
  return "var(--accent)"; // in-progress / other
}

/** A stacked breakdown bar for pipeline projects (Granted / Rejected / In-progress …). */
export function SegmentBar({ segments, height = 6 }: { segments: Segment[]; height?: number }) {
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0);
  if (total <= 0) return <div className="w-full rounded-full" style={{ height, background: "var(--line)" }} />;
  return (
    <div className="flex w-full gap-[2px] overflow-hidden rounded-full" style={{ height }}>
      {segments
        .filter((s) => s.value > 0)
        .map((s, i) => (
          <div
            key={i}
            title={`${s.label}: ${s.value}`}
            style={{ width: `${(s.value / total) * 100}%`, background: colorFor(s.label) }}
          />
        ))}
    </div>
  );
}

/** Compact legend under a SegmentBar: "● Granted 34  ● Rejected 3  ● In progress 6". */
export function SegmentLegend({ segments }: { segments: Segment[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]" style={{ color: "var(--ink-secondary)" }}>
      {segments.map((s, i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          <span className="h-[7px] w-[7px] rounded-full" style={{ background: colorFor(s.label) }} />
          {s.label} <span className="font-mono tabular-nums" style={{ color: "var(--ink)" }}>{s.value}</span>
        </span>
      ))}
    </div>
  );
}
