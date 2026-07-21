type Segment = { label: string; value: number };

function colorFor(label: string): string {
  const l = label.toLowerCase();
  if (/(grant|approv|complet|done|clear|pass|success|won|enroll|hired|certif|fund|resolv|award|publish|active)/.test(l))
    return "var(--health-green)";
  if (/(reject|deni|fail|lost|cancel|declin|withdr|dropp|ineligible|unresolv|abandon)/.test(l)) return "var(--health-red)";
  if (/(risk|hold|pending|escalat|admitted)/.test(l)) return "var(--health-amber)";
  return "var(--accent)"; // in-progress / other
}

const TAU = Math.PI * 2;
const polar = (cx: number, cy: number, r: number, a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;

/** A clean donut chart with a centered total. Pure SVG, theme-aware. */
export function Donut({
  segments,
  size = 168,
  thickness = 22,
  centerValue,
  centerLabel,
}: {
  segments: Segment[];
  size?: number;
  thickness?: number;
  centerValue: string | number;
  centerLabel: string;
}) {
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2;
  let angle = -Math.PI / 2; // start at 12 o'clock

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={centerLabel}>
      {/* track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--line)" strokeWidth={thickness} />
      {total > 0 &&
        segments
          .filter((s) => s.value > 0)
          .map((s, i) => {
            const frac = s.value / total;
            const start = angle;
            const end = angle + frac * TAU;
            angle = end;
            // full-circle single segment: draw a plain ring
            if (frac >= 0.9999) {
              return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={colorFor(s.label)} strokeWidth={thickness} />;
            }
            const [x1, y1] = polar(cx, cy, r, start);
            const [x2, y2] = polar(cx, cy, r, end);
            const large = end - start > Math.PI ? 1 : 0;
            return (
              <path
                key={i}
                d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
                fill="none"
                stroke={colorFor(s.label)}
                strokeWidth={thickness}
                strokeLinecap="butt"
              >
                <title>{`${s.label}: ${s.value}`}</title>
              </path>
            );
          })}
      <text x={cx} y={cy - 4} textAnchor="middle" style={{ fontSize: 30, fontWeight: 600, fill: "var(--ink)" }} className="font-mono">
        {centerValue}
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" style={{ fontSize: 11, fill: "var(--ink-muted)" }} className="uppercase tracking-wide">
        {centerLabel}
      </text>
    </svg>
  );
}

/** Legend rows for a Donut: colored dot + label + value. */
export function DonutLegend({ segments }: { segments: Segment[] }) {
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0);
  return (
    <div className="flex flex-col gap-2">
      {segments.map((s, i) => (
        <div key={i} className="flex items-center gap-2 text-[13px]">
          <span className="h-[9px] w-[9px] shrink-0 rounded-full" style={{ background: colorFor(s.label) }} />
          <span style={{ color: "var(--ink-secondary)" }}>{s.label}</span>
          <span className="ml-auto flex items-baseline gap-1.5">
            <span className="font-mono font-semibold tabular-nums" style={{ color: "var(--ink)" }}>
              {s.value}
            </span>
            <span className="font-mono text-[11px] tabular-nums" style={{ color: "var(--ink-muted)" }}>
              {total > 0 ? `${Math.round((s.value / total) * 100)}%` : ""}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

export { colorFor };
