import { Sparkline } from "@/components/charts/Sparkline";
import { StatTiles, type Stat } from "@/components/charts/StatTiles";
import { HealthBadge } from "@/components/health/HealthBadge";
import { BurnUpChart } from "@/components/project/BurnUpChart";
import { OversightActions } from "@/components/project/OversightActions";
import { PipelineView } from "@/components/project/PipelineView";
import { StatusEndpointField } from "@/components/project/StatusEndpointField";
import { AutoPoll } from "@/components/shell/AutoPoll";
import { TagChip } from "@/components/ui/TagChip";
import { db } from "@/lib/db/client";
import { progressSnapshots, statusUpdates } from "@/lib/db/schema";
import { daysSince } from "@/lib/derive";
import { fmtDate, fmtDateTime, relAge } from "@/lib/format";
import { getWorkspace } from "@/lib/queries/projects";
import { asc, desc, eq } from "drizzle-orm";
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
  const snapshots = db
    .select()
    .from(progressSnapshots)
    .where(eq(progressSnapshots.projectId, id))
    .orderBy(asc(progressSnapshots.takenAt))
    .all();
  const stagesDone = p.stages.filter((s) => s.state === "done").length;
  const linearStats: Stat[] = [
    { label: "Progress", value: `${p.progressPct}%`, tone: "accent" },
    { label: "Stages done", value: `${stagesDone}/${p.stages.length}` },
    { label: "Target", value: fmtDate(p.targetDate) },
    { label: "Updated", value: relAge(p.daysSinceUpdate) },
  ];

  return (
    <div className="mx-auto max-w-[760px] px-5 py-8">
      <AutoPoll />
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
          <h1 className="text-[26px] font-semibold tracking-[-0.02em]">{p.name}</h1>
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

      {/* ————— Pipeline dashboard ————— */}
      {p.shape === "pipeline" &&
        (p.portal ? (
          <PipelineView portal={p.portal} />
        ) : (
          <section className="mt-8">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em]" style={{ color: "var(--ink-muted)" }}>
              Overview
            </h2>
            <p className="mt-2 text-[13.5px]" style={{ color: "var(--ink-muted)" }}>
              Connect this project&apos;s portal to see its live breakdown.
            </p>
            <div className="mt-3">
              <StatusEndpointField projectId={p.id} endpoint={p.statusEndpoint} hasToken={Boolean(p.statusToken)} />
            </div>
          </section>
        ))}

      {/* ————— Metric ————— */}
      {p.shape === "metric" && (
        <section className="mt-8">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em]" style={{ color: "var(--ink-muted)" }}>
            Metric
          </h2>
          {p.portal?.metric?.value != null ? (
            <div className="card mt-3 p-5">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.07em]" style={{ color: "var(--ink-muted)" }}>
                {p.portal.metric.label}
              </div>
              <div className="mt-1.5 font-mono text-[34px] font-medium leading-none tabular-nums" style={{ color: "var(--ink)" }}>
                {p.portal.metric.value}
                {p.portal.metric.unit ? ` ${p.portal.metric.unit}` : ""}
                {p.portal.metric.target != null && (
                  <span className="text-[16px]" style={{ color: "var(--ink-muted)" }}>
                    {" "}
                    / {p.portal.metric.target}
                  </span>
                )}
              </div>
              {p.portal.metric.target != null && p.portal.metric.value != null && (
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(100, Math.round((p.portal.metric.value / p.portal.metric.target) * 100))}%`, background: "var(--accent)" }}
                  />
                </div>
              )}
              {p.portal.history && p.portal.history.length > 1 && (
                <div className="mt-4">
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.07em]" style={{ color: "var(--ink-muted)" }}>
                    Trend
                  </div>
                  <div className="mt-1.5">
                    <Sparkline values={p.portal.history} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-3">
              <StatusEndpointField projectId={p.id} endpoint={p.statusEndpoint} hasToken={Boolean(p.statusToken)} />
            </div>
          )}
        </section>
      )}

      {/* ————— Staged project dashboard ————— */}
      {p.shape === "linear" && (
        <section className="mt-7">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em]" style={{ color: "var(--ink-muted)" }}>
            Overview
          </h2>
          <div className="mt-4">
            <StatTiles stats={linearStats} />
          </div>

          {/* Progress over time */}
          <div className="card mt-4 p-5">
            <div className="text-[13px] font-semibold uppercase tracking-[0.06em]" style={{ color: "var(--ink-muted)" }}>
              Progress over time
            </div>
            <div className="mt-3">
              <BurnUpChart snapshots={snapshots} targetDate={p.targetDate} createdAt={p.createdAt} />
            </div>
          </div>

          {/* Stage stepper */}
          <div className="card mt-4 p-5">
            <div className="flex items-baseline justify-between">
              <div className="text-[13px] font-semibold uppercase tracking-[0.06em]" style={{ color: "var(--ink-muted)" }}>
                Stages
              </div>
              <span className="text-[13px] font-medium tabular-nums" style={{ color: "var(--ink-secondary)" }}>
                {p.currentStage?.name ?? (p.stages.length ? "Complete" : "No stages")}
              </span>
            </div>
            <ol className="mt-3 flex flex-col gap-0.5">
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
          </div>
        </section>
      )}

      {/* ————— Oversight: flag / ask for status ————— */}
      <section className="mt-9">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em]" style={{ color: "var(--ink-muted)" }}>
          Oversight
        </h2>
        <div className="mt-4 flex flex-col gap-3">
          <OversightActions
            projectId={p.id}
            flagged={p.flagged}
            flagNote={p.flagNote}
            daysSinceRequest={daysSince(p.statusRequestedAt, new Date())}
            ownerName={p.ownerName}
            ownerEmail={p.ownerEmail}
          />
          {/* Portal connection (setup) lives here, out of the way of the data */}
          {(p.shape === "pipeline" || p.shape === "metric") && p.portal && (
            <StatusEndpointField projectId={p.id} endpoint={p.statusEndpoint} hasToken={Boolean(p.statusToken)} />
          )}
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
