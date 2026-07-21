import { Donut, DonutLegend } from "@/components/charts/Donut";
import { StageBars } from "@/components/charts/StageBars";
import { StatTiles, type Stat } from "@/components/charts/StatTiles";
import type { DerivedProject } from "@/lib/derive";
import { sinceLabel } from "@/lib/format";

function toneFor(label: string): NonNullable<Stat["tone"]> {
  const l = label.toLowerCase();
  if (/(grant|approv|complet|done|clear|pass|success|won|enroll|hired|certif|fund|resolv|award|publish|active)/.test(l)) return "green";
  if (/(reject|deni|fail|lost|cancel|declin|withdr|dropp|ineligible|unresolv|abandon)/.test(l)) return "red";
  if (/(risk|hold|pending|escalat|admitted)/.test(l)) return "amber";
  return "accent";
}

/** The pipeline project dashboard: KPI tiles + outcome donut + stage funnel. */
export function PipelineView({ portal }: { portal: NonNullable<DerivedProject["portal"]> }) {
  const segs = portal.segments ?? [];
  const total = segs.reduce((s, x) => s + Math.max(0, x.value), 0);
  const green = segs.find((s) => toneFor(s.label) === "green");
  const rate = green && total > 0 ? Math.round((green.value / total) * 100) : null;

  const stats: Stat[] = [
    { label: "Total", value: total },
    ...segs.map((s) => ({ label: s.label, value: s.value, tone: toneFor(s.label) })),
    ...(rate != null && green ? [{ label: `${green.label} rate`, value: `${rate}%`, tone: "green" as const }] : []),
  ];

  return (
    <section className="mt-7">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em]" style={{ color: "var(--ink-muted)" }}>
          Overview
        </h2>
        <span className="font-mono text-[11.5px]" style={{ color: "var(--ink-muted)" }}>
          {portal.live ? (portal.fresh ? "live · checked" : "no signal · checked") : "as of"} {sinceLabel(portal.checkedAt)}
        </span>
      </div>

      {portal.summary && (
        <p className="mt-2 text-[14px]" style={{ color: "var(--ink-secondary)" }}>
          {portal.summary}
        </p>
      )}

      {/* KPI tiles */}
      {segs.length > 0 && (
        <div className="mt-4">
          <StatTiles stats={stats} />
        </div>
      )}

      {/* Charts */}
      {(segs.length > 0 || (portal.stageCounts?.length ?? 0) > 0) && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {segs.length > 0 && (
            <div className="card p-5">
              <div className="text-[13px] font-semibold uppercase tracking-[0.06em]" style={{ color: "var(--ink-muted)" }}>
                Outcomes
              </div>
              <div className="mt-4 flex items-center gap-5">
                <Donut segments={segs} centerValue={total} centerLabel="total" />
                <div className="min-w-0 flex-1">
                  <DonutLegend segments={segs} />
                </div>
              </div>
            </div>
          )}
          {(portal.stageCounts?.length ?? 0) > 0 && (
            <div className="card p-5">
              <div className="text-[13px] font-semibold uppercase tracking-[0.06em]" style={{ color: "var(--ink-muted)" }}>
                Where everyone is
              </div>
              <div className="mt-4">
                <StageBars items={portal.stageCounts!} />
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
