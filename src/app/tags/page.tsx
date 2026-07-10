import { TAG_ROW_GRID, TagRegistryRow } from "@/components/filters/TagRegistryRow";
import { db } from "@/lib/db/client";
import { projectTags, tagGroups, tags, type TagRow } from "@/lib/db/schema";
import { count } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const byName = (a: TagRow, b: TagRow) => a.name.localeCompare(b.name);

export default async function TagsPage() {
  const groupRows = db.select().from(tagGroups).all();
  const tagRows = db.select().from(tags).all();
  const usageRows = db
    .select({ tagId: projectTags.tagId, n: count() })
    .from(projectTags)
    .groupBy(projectTags.tagId)
    .all();
  const usageByTag = new Map(usageRows.map((r) => [r.tagId, r.n]));

  const sections = groupRows
    .map((g) => ({ id: g.id, name: g.name, tags: tagRows.filter((t) => t.tagGroupId === g.id).sort(byName) }))
    .filter((s) => s.tags.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
  const freeTags = tagRows.filter((t) => !t.tagGroupId).sort(byName);

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-6 lg:px-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[13px] transition-colors hover:text-[var(--ink)]"
        style={{ color: "var(--ink-muted)" }}
      >
        <ArrowLeft size={14} /> All projects
      </Link>

      <header className="mt-5 flex items-baseline gap-3">
        <h1 className="text-[22px] font-semibold tracking-[-0.01em]">Tags</h1>
        <span className="font-mono text-[11px]" style={{ color: "var(--ink-muted)" }}>
          {tagRows.length}
        </span>
      </header>
      <p className="mt-1.5 max-w-lg text-[13px]" style={{ color: "var(--ink-secondary)" }}>
        The shared vocabulary. Renames apply everywhere instantly; deleting a tag removes it from every
        project that uses it.
      </p>

      {tagRows.length === 0 ? (
        <div className="card mt-8 border-dashed px-8 py-16 text-center" style={{ borderStyle: "dashed" }}>
          <div className="text-[15px] font-semibold">No tags yet</div>
          <div className="mt-1 text-[13px]" style={{ color: "var(--ink-muted)" }}>
            Tags are created when you add them to a project.
          </div>
        </div>
      ) : (
        <div className="card rise-in mt-8 overflow-x-auto">
          <div className="min-w-[780px]">
            {/* Column headers */}
            <div className={`${TAG_ROW_GRID} border-b py-2.5`} style={{ borderColor: "var(--line)" }}>
              <span className="microlabel">Tag</span>
              <span className="microlabel">Group</span>
              <span className="microlabel">Definition</span>
              <span className="microlabel text-right">Usage</span>
              <span />
            </div>

            {sections.map((s) => (
              <section key={s.id}>
                <div
                  className="flex items-baseline gap-2 border-b px-4 pb-1.5 pt-4"
                  style={{ borderColor: "var(--line)", background: "var(--canvas)" }}
                >
                  <span className="microlabel">{s.name}</span>
                  <span className="font-mono text-[10px]" style={{ color: "var(--ink-muted)" }}>
                    {s.tags.length}
                  </span>
                </div>
                {s.tags.map((t) => (
                  <TagRegistryRow key={t.id} tag={t} groupName={s.name} usage={usageByTag.get(t.id) ?? 0} />
                ))}
              </section>
            ))}

            {freeTags.length > 0 && (
              <section>
                <div
                  className="flex items-baseline gap-2 border-b px-4 pb-1.5 pt-4"
                  style={{ borderColor: "var(--line)", background: "var(--canvas)" }}
                >
                  <span className="microlabel">Free tags</span>
                  <span className="font-mono text-[10px]" style={{ color: "var(--ink-muted)" }}>
                    {freeTags.length}
                  </span>
                </div>
                {freeTags.map((t) => (
                  <TagRegistryRow key={t.id} tag={t} groupName={null} usage={usageByTag.get(t.id) ?? 0} />
                ))}
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
