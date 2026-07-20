import { StatusDot } from "@/components/health/StatusDot";
import { Avatar } from "@/components/ui/Avatar";
import { SegmentBar } from "@/components/ui/SegmentBar";
import { StageBar } from "@/components/ui/StageBar";
import type { DerivedProject } from "@/lib/derive";
import { Bell, Flag } from "lucide-react";
import Link from "next/link";

/** Clean tile — shape-aware: linear shows a stage bar + %, pipeline/metric show
 *  what the project actually reports (a breakdown or a headline number). */
export function ProjectCard({ project: p, index = 0 }: { project: DerivedProject; index?: number }) {
  const stale = p.displayHealth.kind === "stale";
  const linear = p.shape === "linear";
  const segments = p.portal?.segments ?? null;

  return (
    <div className="card card-lift rise-in relative p-[17px]" style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}>
      <Link href={`/projects/${p.id}`} aria-label={p.name} className="absolute inset-0 rounded-[14px]" />

      <div className="pointer-events-none relative flex items-center gap-2.5">
        <StatusDot dh={p.displayHealth} lifecycle={p.lifecycle} size={9} withRing={stale} />
        <h3 className="truncate text-[15px] font-semibold tracking-[-0.015em]" style={{ color: "var(--ink)" }}>
          {p.name}
        </h3>
        {p.flagged && <Flag size={13} strokeWidth={2} fill="currentColor" className="shrink-0" style={{ color: "var(--health-red)" }} />}
        {p.statusRequestedAt && !p.flagged && <Bell size={13} strokeWidth={2} className="shrink-0" style={{ color: "var(--health-amber)" }} />}
        <span className="ml-auto shrink-0">
          <Avatar person={p.lead} size={22} />
        </span>
      </div>

      {/* Progress representation — by shape */}
      <div className="pointer-events-none relative mt-[15px]">
        {linear ? (
          <StageBar stages={p.stages} height={5} />
        ) : segments ? (
          <SegmentBar segments={segments} height={6} />
        ) : (
          <div className="h-[6px] w-full rounded-full" style={{ background: "var(--line)" }} />
        )}
      </div>

      {/* One honest status line */}
      <div className="pointer-events-none relative mt-3 flex items-center gap-1.5 text-[12px]" style={{ color: "var(--ink-muted)" }}>
        <span className="truncate">
          {p.portal?.summary || (linear ? p.stageLabel : "Awaiting report")}
        </span>
        {linear && (
          <span className="ml-auto font-medium tabular-nums" style={{ color: "var(--ink-secondary)" }}>
            {p.progressPct}%
          </span>
        )}
        {!linear && p.portal?.metric?.value != null && (
          <span className="ml-auto whitespace-nowrap font-medium tabular-nums" style={{ color: "var(--ink-secondary)" }}>
            {p.portal.metric.label} {p.portal.metric.value}
            {p.portal.metric.target != null ? `/${p.portal.metric.target}` : ""}
          </span>
        )}
      </div>
    </div>
  );
}
