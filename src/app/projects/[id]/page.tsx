import { HealthBadge } from "@/components/health/HealthBadge";
import { OversightActions } from "@/components/project/OversightActions";
import { StatusEndpointField } from "@/components/project/StatusEndpointField";
import { SegmentBar, SegmentLegend } from "@/components/ui/SegmentBar";
import { TagChip } from "@/components/ui/TagChip";
import { db } from "@/lib/db/client";
import { statusUpdates } from "@/lib/db/schema";
import { daysSince } from "@/lib/derive";
import { fmtDate, fmtDateTime, relAge, sinceLabel } from "@/lib/format";
import { getWorkspace } from "@/lib/queries/projects";
import { desc, eq } from "drizzle-orm";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ws = getWorkspace();
  const p = ws.projects.find((x) => x.id === id);
  if (!p) notFound();

  const folder = ws.folders.find((f) => f.id === p.folderId);
  const peopleById = new Map(ws.people.map((x) => [x.id, x]));
  const updates = db
    .select()
    .from(statusUpdates)
    .where(eq(statusUpdates.projectId, id))
    .orderBy(desc(statusUpdates.createdAt))
    .all();

  return (
    <div className="mx-auto max-w-[760px] px-5 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[13px] transition-colors hover:text-[var(--ink)]"
        style={{ color: "var(--ink-muted)" }}
      >
        <ArrowLeft size={14} /> All projects
      </Link>

      {/* ————— Header ————— */}
      <header className="mt-5 flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[26px] font-semibold tracking-[-0.02em]">{p.name}</h1>
            <HealthBadge dh={p.displayHealth} lifecycle={p.lifecycle} />
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px]" style={{ color: "var(--ink-muted)" }}>
            {(p.ownerName || p.ownerEmail) && (
              <span className="flex items-center gap-1.5">
                Owner: <span style={{ color: "var(--ink-secondary)" }}>{p.ownerName || p.ownerEmail}</span>
              </span>
            )}
            {folder && (
              <span className="flex items-center gap-1.5">
                <span className="h-[7px] w-[7px] rounded-full" style={{ background: folder.color ?? "var(--line-strong)" }} />
                {folder.name}
              </span>
            )}
            {p.targetDate && <span>Target {fmtDate(p.targetDate)}</span>}
            {p.daysSinceUpdate !== null && <span>Updated {relAge(p.daysSinceUpdate)}</span>}
            {p.tags.map((t) => (
              <TagChip key={t.id} tag={t} />
            ))}
          </div>
        </div>

        {/* Prominent: open the actual external dashboard */}
        {p.externalLinks.length > 0 && (
          <div className="flex shrink-0 flex-col gap-2">
            {p.externalLinks.map((l) => (
              <a
                key={l.url}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-[38px] items-center gap-2 rounded-[9px] px-4 text-[13.5px] font-semibold transition-opacity hover:opacity-90"
                style={{ background: "var(--btn)", color: "var(--btn-ink)", boxShadow: "var(--shadow)" }}
              >
                {l.label || "Open dashboard"}
                <ArrowUpRight size={16} strokeWidth={2.2} />
              </a>
            ))}
          </div>
        )}
      </header>

      {/* ————— Description (plain, no README framing) ————— */}
      {p.description.trim() && (
        <p className="mt-6 text-[14.5px] leading-[1.7] whitespace-pre-wrap" style={{ color: "var(--ink-secondary)" }}>
          {p.description}
        </p>
      )}

      {/* ————— Reported status (pulled up from the project's own portal) ————— */}
      <section className="mt-8">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em]" style={{ color: "var(--ink-muted)" }}>
          Reported status
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          <StatusEndpointField projectId={p.id} endpoint={p.statusEndpoint} hasToken={Boolean(p.statusToken)} />
          {p.portal && (
            <>
              <div className="text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                {p.portal.summary ? <span>“{p.portal.summary}”</span> : <span style={{ color: "var(--ink-muted)" }}>No summary reported.</span>}
                <span className="ml-2 font-mono text-[11.5px]" style={{ color: p.portal.fresh ? "var(--ink-muted)" : "var(--health-stale-text)" }}>
                  · {p.portal.fresh ? "checked" : "no signal · checked"} {sinceLabel(p.portal.checkedAt)}
                </span>
              </div>
              {/* Pipeline breakdown */}
              {p.portal.segments && (
                <div className="mt-1 flex flex-col gap-2">
                  <SegmentBar segments={p.portal.segments} height={8} />
                  <SegmentLegend segments={p.portal.segments} />
                </div>
              )}
              {/* Headline metric (metric-shape / supporting figure) */}
              {!p.portal.segments && p.portal.metric?.value != null && (
                <div className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                  {p.portal.metric.label}: {p.portal.metric.value}
                  {p.portal.metric.target != null ? ` / ${p.portal.metric.target}` : ""}
                  {p.portal.metric.unit ? ` ${p.portal.metric.unit}` : ""}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ————— Stages — LINEAR projects only ————— */}
      {p.shape === "linear" && (
        <section className="mt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em]" style={{ color: "var(--ink-muted)" }}>
              Stages
            </h2>
            <span className="text-[13px] font-medium tabular-nums" style={{ color: "var(--ink-secondary)" }}>
              {p.progressPct}% · {p.currentStage?.name ?? (p.stages.length ? "Complete" : "No stages")}
            </span>
          </div>

          <ol className="mt-4 flex flex-col gap-0.5">
            {p.stages.map((s) => {
              const done = s.state === "done";
              const current = s.state === "current";
              return (
                <li key={s.id} className="flex items-center gap-3 py-2">
                  <StageMark done={done} current={current} blocked={s.state === "blocked"} />
                  <span
                    className="text-[14px]"
                    style={{
                      color: done ? "var(--ink-muted)" : "var(--ink)",
                      fontWeight: current ? 600 : 400,
                      textDecoration: done ? "line-through" : "none",
                      textDecorationColor: "var(--line-strong)",
                    }}
                  >
                    {s.name}
                  </span>
                  <span className="ml-auto flex items-center gap-2.5 text-[12px]" style={{ color: "var(--ink-muted)" }}>
                    {s.targetDate && <span className="tabular-nums">{fmtDate(s.targetDate)}</span>}
                  </span>
                </li>
              );
            })}
            {p.stages.length === 0 && (
              <li className="py-2 text-[13.5px]" style={{ color: "var(--ink-muted)" }}>
                No stages yet.
              </li>
            )}
          </ol>
        </section>
      )}

      {/* ————— Oversight: flag / ask for status ————— */}
      <section className="mt-9">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em]" style={{ color: "var(--ink-muted)" }}>
          Oversight
        </h2>
        <div className="mt-4">
          <OversightActions
            projectId={p.id}
            flagged={p.flagged}
            flagNote={p.flagNote}
            daysSinceRequest={daysSince(p.statusRequestedAt, new Date())}
            ownerName={p.ownerName}
            ownerEmail={p.ownerEmail}
          />
        </div>
      </section>

      {/* ————— Update history from the owner's portal (read-only) ————— */}
      {updates.length > 0 && (
        <section className="mt-9">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em]" style={{ color: "var(--ink-muted)" }}>
            Reported updates
          </h2>
          <div className="mt-4 flex flex-col gap-3.5">
            {updates.slice(0, 5).map((u) => {
              const author = peopleById.get(u.authorId);
              return (
                <article key={u.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2.5">
                    <HealthBadge dh={{ kind: "rag", health: u.health, ring: "solid" }} size="sm" />
                    {author && <span className="text-[12.5px]" style={{ color: "var(--ink-secondary)" }}>{author.name}</span>}
                    <span className="ml-auto text-[11.5px] tabular-nums" style={{ color: "var(--ink-muted)" }}>
                      {fmtDateTime(u.createdAt)}
                    </span>
                  </div>
                  <p className="text-[13.5px] leading-relaxed">{u.note}</p>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function StageMark({ done, current, blocked }: { done: boolean; current: boolean; blocked: boolean }) {
  if (done)
    return (
      <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full" style={{ background: "var(--health-green)" }}>
        <Check size={11} strokeWidth={3} color="#fff" />
      </span>
    );
  if (current)
    return (
      <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full" style={{ boxShadow: "inset 0 0 0 2px var(--ink)" }}>
        <span className="h-[7px] w-[7px] rounded-full" style={{ background: "var(--ink)" }} />
      </span>
    );
  if (blocked)
    return <span className="h-[18px] w-[18px] shrink-0 rounded-full" style={{ background: "var(--health-amber)" }} />;
  return <span className="h-[18px] w-[18px] shrink-0 rounded-full" style={{ boxShadow: "inset 0 0 0 1.5px var(--line-strong)" }} />;
}
