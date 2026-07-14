import { StatusDot } from "@/components/health/StatusDot";
import { Avatar } from "@/components/ui/Avatar";
import { StageBar } from "@/components/ui/StageBar";
import type { DerivedProject } from "@/lib/derive";
import { Bell, Flag, TriangleAlert } from "lucide-react";
import Link from "next/link";

/** Refined tile: status dot + name + owner, thin stage bar, one quiet meta line. */
export function ProjectCard({ project: p, index = 0 }: { project: DerivedProject; index?: number }) {
  const stale = p.displayHealth.kind === "stale";
  const metaNote = p.portal?.summary || p.stageLabel;

  return (
    <div
      className="card card-lift rise-in relative p-[17px]"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <Link href={`/projects/${p.id}`} aria-label={p.name} className="absolute inset-0 rounded-[14px]" />

      <div className="pointer-events-none relative flex items-center gap-2.5">
        <StatusDot dh={p.displayHealth} lifecycle={p.lifecycle} size={9} withRing={stale} />
        <h3 className="truncate text-[15px] font-semibold tracking-[-0.015em]" style={{ color: "var(--ink)" }}>
          {p.name}
        </h3>
        {p.flagged && (
          <Flag size={13} strokeWidth={2} fill="currentColor" className="shrink-0" style={{ color: "var(--health-red)" }} />
        )}
        {p.statusRequestedAt && !p.flagged && (
          <Bell size={13} strokeWidth={2} className="shrink-0" style={{ color: "var(--health-amber)" }} />
        )}
        <span className="ml-auto shrink-0">
          <Avatar person={p.lead} size={22} />
        </span>
      </div>

      <div className="pointer-events-none relative mt-[15px]">
        <StageBar stages={p.stages} height={5} />
      </div>

      <div
        className="pointer-events-none relative mt-3 flex items-center gap-1.5 text-[12px]"
        style={{ color: "var(--ink-muted)" }}
      >
        {p.isWatermelon && (
          <>
            <span className="inline-flex items-center gap-1" style={{ color: "var(--health-amber)" }}>
              <TriangleAlert size={12} strokeWidth={2} /> behind
            </span>
            <span aria-hidden>·</span>
          </>
        )}
        <span className="truncate">{metaNote}</span>
        <span className="ml-auto font-medium tabular-nums" style={{ color: "var(--ink-secondary)" }}>
          {p.progressPct}%
        </span>
      </div>
    </div>
  );
}
