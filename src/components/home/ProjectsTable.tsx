"use client";

import { HealthGlyph, healthVars, healthWord } from "@/components/health/HealthGlyph";
import { Avatar } from "@/components/ui/Avatar";
import { TagChip } from "@/components/ui/TagChip";
import { needsAttentionRank, needsAttentionSort, type DerivedProject } from "@/lib/derive";
import { fmtDate, relAge } from "@/lib/format";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type SortKey = "name" | "health" | "progress" | "stage" | "lead" | "target" | "updated";
type SortState = { key: SortKey; dir: 1 | -1 } | null;

const COMPARATORS: Record<SortKey, (a: DerivedProject, b: DerivedProject) => number> = {
  name: (a, b) => a.name.localeCompare(b.name),
  health: (a, b) => needsAttentionRank(a.displayHealth) - needsAttentionRank(b.displayHealth),
  progress: (a, b) => a.progressPct - b.progressPct,
  stage: (a, b) => {
    const an = a.currentStage?.name;
    const bn = b.currentStage?.name;
    if (!an && !bn) return 0;
    if (!an) return 1; // stage-less rows sink on ascending sort
    if (!bn) return -1;
    return an.localeCompare(bn);
  },
  lead: (a, b) => a.lead.name.localeCompare(b.lead.name),
  target: (a, b) => (a.targetDate ?? "9999").localeCompare(b.targetDate ?? "9999"),
  updated: (a, b) => (a.daysSinceUpdate ?? Infinity) - (b.daysSinceUpdate ?? Infinity),
};

const HEADERS: { key: SortKey; label: string; sticky?: boolean }[] = [
  { key: "name", label: "Name", sticky: true },
  { key: "health", label: "Health" },
  { key: "progress", label: "Progress" },
  { key: "stage", label: "Current stage" },
  { key: "lead", label: "Lead" },
  { key: "target", label: "Target" },
  { key: "updated", label: "Updated" },
];

/** Dense scannable table view — default order is needs-attention (fires first). */
export function ProjectsTable({ projects }: { projects: DerivedProject[] }) {
  const router = useRouter();
  const [sort, setSort] = useState<SortState>(null);

  const rows = useMemo(() => {
    if (!sort) return needsAttentionSort(projects);
    const cmp = COMPARATORS[sort.key];
    return [...projects].sort((a, b) => cmp(a, b) * sort.dir);
  }, [projects, sort]);

  const toggleSort = (key: SortKey) => {
    setSort((s) => (s?.key === key ? (s.dir === 1 ? { key, dir: -1 } : null) : { key, dir: 1 }));
  };

  const open = (id: string) => router.push(`/projects/${id}`);

  return (
    <div className="card rise-in overflow-x-auto">
      <table className="w-full min-w-[920px] border-collapse text-left">
        <thead>
          <tr className="border-b" style={{ borderColor: "var(--line)" }}>
            {HEADERS.map((h) => {
              const active = sort?.key === h.key;
              return (
                <th
                  key={h.key}
                  scope="col"
                  className={`px-3 py-2.5 first:pl-4 ${h.sticky ? "sticky left-0 z-[2] bg-[var(--surface)]" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(h.key)}
                    aria-sort={active ? (sort!.dir === 1 ? "ascending" : "descending") : undefined}
                    className="inline-flex items-center gap-1 font-mono text-[10px] font-medium uppercase tracking-[0.08em] transition-colors hover:text-[var(--ink)]"
                    style={{ color: active ? "var(--ink)" : "var(--ink-muted)" }}
                  >
                    {h.label}
                    {active &&
                      (sort!.dir === 1 ? (
                        <ArrowUp size={12} strokeWidth={2} />
                      ) : (
                        <ArrowDown size={12} strokeWidth={2} />
                      ))}
                  </button>
                </th>
              );
            })}
            <th scope="col" className="px-3 py-2.5 pr-4">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
                Tags
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const hv = healthVars(p.displayHealth);
            return (
              <tr
                key={p.id}
                tabIndex={0}
                onClick={() => open(p.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") open(p.id);
                }}
                className="group cursor-pointer border-b transition-colors last:border-b-0 hover:bg-[var(--accent-soft)] focus-visible:bg-[var(--accent-soft)]"
                style={{ borderColor: "var(--line)" }}
              >
                {/* Name — sticky left; opaque bg so it covers scrolled cells, hover composited over it */}
                <td className="sticky left-0 z-[1] max-w-[280px] bg-[var(--surface)] px-3 py-2.5 pl-4 group-hover:[background:linear-gradient(var(--accent-soft),var(--accent-soft)),var(--surface)]">
                  <span className="flex items-center gap-2">
                    <HealthGlyph dh={p.displayHealth} size={12} />
                    <span className="truncate text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>
                      {p.name}
                    </span>
                  </span>
                </td>

                <td className="whitespace-nowrap px-3 py-2.5 text-[12.5px] font-medium" style={{ color: hv.text }}>
                  {healthWord(p.displayHealth, p.lifecycle)}
                </td>

                <td className="whitespace-nowrap px-3 py-2.5">
                  <span className="flex items-center gap-2">
                    <span className="w-[34px] shrink-0 text-right font-mono text-[11px] tabular-nums" style={{ color: "var(--ink-secondary)" }}>
                      {p.progressPct}%
                    </span>
                    <span className="h-[3px] w-12 overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
                      <span className="block h-full rounded-full" style={{ width: `${p.progressPct}%`, background: "var(--accent)" }} />
                    </span>
                  </span>
                </td>

                <td className="max-w-[200px] truncate px-3 py-2.5 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                  {p.currentStage?.name ?? (p.stages.length === 0 ? "No stage" : "All stages done")}
                </td>

                <td className="whitespace-nowrap px-3 py-2.5">
                  <span className="flex items-center gap-1.5 text-[12.5px]" style={{ color: "var(--ink-secondary)" }}>
                    <Avatar person={p.lead} size={18} />
                    {p.lead.name}
                  </span>
                </td>

                <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px]" style={{ color: "var(--ink-muted)" }}>
                  {fmtDate(p.targetDate)}
                </td>

                <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px]" style={{ color: "var(--ink-muted)" }}>
                  {relAge(p.daysSinceUpdate)}
                </td>

                <td className="whitespace-nowrap px-3 py-2.5 pr-4">
                  <span className="flex items-center gap-1.5">
                    {p.tags.slice(0, 2).map((t) => (
                      <TagChip key={t.id} tag={t} />
                    ))}
                    {p.tags.length > 2 && (
                      <span className="font-mono text-[10px]" style={{ color: "var(--ink-muted)" }}>
                        +{p.tags.length - 2}
                      </span>
                    )}
                  </span>
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-10 text-center text-[13px]" style={{ color: "var(--ink-muted)" }}>
                No projects to show.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
