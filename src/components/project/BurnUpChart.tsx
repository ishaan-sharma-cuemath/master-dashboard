"use client";

import type { ProgressSnapshotRow } from "@/lib/db/schema";
import { useEffect, useMemo, useRef, useState } from "react";

const H = 220;
const PT = 22; // headroom for the target chip
const PR = 14;
const PB = 24; // x-axis labels
const PL = 36; // y-axis labels
const DAY = 86_400_000;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtMs = (ms: number) => {
  const d = new Date(ms);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
};
const fmtNum = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/**
 * Hand-rolled burn-up: stepped scope line (ink-muted) vs completed line (accent,
 * soft area fill), dashed target-date marker, hover crosshair + tooltip.
 * Series persist to "now" — state genuinely holds until the next mutation snapshots it.
 */
export function BurnUpChart({
  snapshots,
  targetDate,
  createdAt,
}: {
  snapshots: ProgressSnapshotRow[];
  targetDate: string | null;
  createdAt: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [now] = useState(() => Date.now());
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const model = useMemo(() => {
    if (snapshots.length === 0) return null;
    const pts = snapshots
      .map((s) => ({ t: new Date(s.takenAt).getTime(), scope: s.scopeTotal, done: s.completed }))
      .sort((a, b) => a.t - b.t);

    const targetMs = targetDate
      ? (() => {
          const [y, m, d] = targetDate.split("-").map(Number);
          return new Date(y, m - 1, d).getTime();
        })()
      : null;

    const tMin = Math.min(pts[0].t, new Date(createdAt).getTime());
    let tMax = Math.max(now, targetMs ?? 0, pts[pts.length - 1].t);
    if (tMax - tMin < DAY) tMax = tMin + DAY;

    const maxScope = Math.max(1, ...pts.map((p) => p.scope));
    const step = Math.max(1, Math.ceil(maxScope / 3));
    const yTicks: number[] = [];
    for (let v = 0; v <= maxScope; v += step) yTicks.push(v);

    return { pts, tMin, tMax, targetMs, maxScope, yTicks };
  }, [snapshots, targetDate, createdAt, now]);

  if (!model) {
    return (
      <div className="flex items-center justify-center" style={{ height: 120 }}>
        <span className="text-[13px]" style={{ color: "var(--ink-muted)" }}>
          No history yet
        </span>
      </div>
    );
  }

  const { pts, tMin, tMax, targetMs, maxScope, yTicks } = model;
  const plotW = Math.max(width - PL - PR, 40);
  const x = (t: number) => PL + ((t - tMin) / (tMax - tMin)) * plotW;
  const y = (v: number) => H - PB - (v / maxScope) * (H - PT - PB);
  const xNow = x(Math.min(Math.max(now, pts[pts.length - 1].t), tMax));
  const last = pts[pts.length - 1];

  // Scope: stepped (step-after), held flat to now.
  let scopePath = `M ${x(pts[0].t)} ${y(pts[0].scope)}`;
  for (let i = 1; i < pts.length; i++) scopePath += ` H ${x(pts[i].t)} V ${y(pts[i].scope)}`;
  scopePath += ` H ${xNow}`;

  // Completed: linear through points, held flat to now.
  let donePath = `M ${x(pts[0].t)} ${y(pts[0].done)}`;
  for (let i = 1; i < pts.length; i++) donePath += ` L ${x(pts[i].t)} ${y(pts[i].done)}`;
  donePath += ` L ${xNow} ${y(last.done)}`;
  const doneArea = `${donePath} L ${xNow} ${y(0)} L ${x(pts[0].t)} ${y(0)} Z`;

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    let best = 0;
    let bestDist = Infinity;
    pts.forEach((p, i) => {
      const d = Math.abs(x(p.t) - mx);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setHover(best);
  };

  const hp = hover !== null ? pts[hover] : null;
  const tooltipLeft = hp ? (x(hp.t) > width - 150 ? x(hp.t) - 148 : x(hp.t) + 10) : 0;

  // Target chip geometry (SVG-side, flipped when close to the right edge).
  const targetLabel = targetMs !== null ? `TARGET ${fmtMs(targetMs).toUpperCase()}` : "";
  const chipW = targetLabel.length * 6 + 12;
  const tx = targetMs !== null ? x(targetMs) : 0;
  const chipX = targetMs !== null ? (tx + chipW + 4 > width - PR ? tx - chipW - 4 : tx + 4) : 0;

  return (
    <div ref={wrapRef} className="relative w-full" style={{ height: H }}>
      {width > 0 && (
        <svg width={width} height={H} onMouseMove={onMove} onMouseLeave={() => setHover(null)} className="block">
          {/* gridlines + y labels */}
          {yTicks.map((v) => (
            <g key={v}>
              <line x1={PL} x2={width - PR} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeWidth="1" />
              <text
                x={PL - 6}
                y={y(v)}
                textAnchor="end"
                dominantBaseline="central"
                fontSize="10"
                fontFamily="var(--font-mono)"
                fill="var(--ink-muted)"
              >
                {fmtNum(v)}
              </text>
            </g>
          ))}

          {/* x labels: start / mid / end */}
          {[tMin, (tMin + tMax) / 2, tMax].map((t, i) => (
            <text
              key={i}
              x={x(t)}
              y={H - 8}
              textAnchor={i === 0 ? "start" : i === 2 ? "end" : "middle"}
              fontSize="10"
              fontFamily="var(--font-mono)"
              fill="var(--ink-muted)"
            >
              {fmtMs(t)}
            </text>
          ))}

          {/* target-date marker */}
          {targetMs !== null && (
            <g>
              <line
                x1={tx}
                x2={tx}
                y1={PT - 4}
                y2={H - PB}
                stroke="var(--line-strong)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <rect x={chipX} y={PT - 12} width={chipW} height={15} rx="4" fill="var(--surface-raised)" stroke="var(--line)" />
              <text
                x={chipX + chipW / 2}
                y={PT - 4}
                textAnchor="middle"
                fontSize="9.5"
                fontFamily="var(--font-mono)"
                letterSpacing="0.05em"
                fill="var(--ink-muted)"
              >
                {targetLabel}
              </text>
            </g>
          )}

          {/* series */}
          <path d={doneArea} fill="var(--accent)" fillOpacity="0.08" stroke="none" />
          <path d={scopePath} fill="none" stroke="var(--ink-muted)" strokeWidth="1.5" />
          <path
            d={donePath}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* hover crosshair */}
          {hp && (
            <g>
              <line x1={x(hp.t)} x2={x(hp.t)} y1={PT} y2={H - PB} stroke="var(--line-strong)" strokeWidth="1" />
              <circle cx={x(hp.t)} cy={y(hp.done)} r="3.5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2" />
              <circle cx={x(hp.t)} cy={y(hp.scope)} r="3" fill="var(--ink-muted)" stroke="var(--surface)" strokeWidth="2" />
            </g>
          )}
        </svg>
      )}

      {/* legend — identity never by color alone */}
      <div className="absolute right-0 top-0 flex items-center gap-3 font-mono text-[10px]" style={{ color: "var(--ink-muted)" }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-[2px] w-3 rounded-full" style={{ background: "var(--accent)" }} />
          completed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-[2px] w-3 rounded-full" style={{ background: "var(--ink-muted)" }} />
          scope
        </span>
      </div>

      {/* tooltip */}
      {hp && (
        <div
          className="pointer-events-none absolute z-10 rounded-[6px] border px-2.5 py-1.5 font-mono text-[11px]"
          style={{ left: tooltipLeft, top: PT + 4, background: "var(--surface-raised)", borderColor: "var(--line)" }}
        >
          <div style={{ color: "var(--ink)" }}>{fmtMs(hp.t)}</div>
          <div className="mt-0.5 flex items-center gap-1.5" style={{ color: "var(--ink-secondary)" }}>
            <span className="inline-block h-[2px] w-2.5" style={{ background: "var(--ink-muted)" }} />
            scope {fmtNum(hp.scope)}
          </div>
          <div className="flex items-center gap-1.5" style={{ color: "var(--ink-secondary)" }}>
            <span className="inline-block h-[2px] w-2.5" style={{ background: "var(--accent)" }} />
            completed {fmtNum(hp.done)}
          </div>
        </div>
      )}
    </div>
  );
}
