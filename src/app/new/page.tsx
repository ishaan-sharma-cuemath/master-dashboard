import { WizardShell } from "@/components/wizard/WizardShell";
import type { WizardData } from "@/components/wizard/draft";
import { db } from "@/lib/db/client";
import { tagGroups } from "@/lib/db/schema";
import { getWorkspace } from "@/lib/queries/projects";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const ws = getWorkspace();
  const tagGroupRows = db.select().from(tagGroups).all();

  const archiveFolder = ws.folders.find((f) => f.isSystem === "archive");
  const unsortedFolder = ws.folders.find((f) => f.isSystem === "unsorted") ?? ws.folders[0];
  const akash = ws.people.find((p) => p.name === "Akash") ?? ws.people[0];

  const data: WizardData = {
    folders: ws.folders.filter((f) => f.isSystem !== "archive"),
    people: ws.people,
    tags: ws.tags,
    tagGroups: tagGroupRows,
    projects: ws.projects
      .filter((p) => !p.archivedAt && p.folderId !== archiveFolder?.id)
      .map((p) => ({ id: p.id, name: p.name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    defaults: { leadId: akash?.id ?? "", folderId: unsortedFolder?.id ?? "" },
  };

  return (
    <div className="mx-auto max-w-[640px] px-4 py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[13px] transition-colors hover:text-[var(--ink)]"
        style={{ color: "var(--ink-muted)" }}
      >
        <ArrowLeft size={14} /> All projects
      </Link>

      <div className="mt-5 flex items-baseline justify-between">
        <h1 className="text-[22px] font-semibold tracking-[-0.01em]">New project</h1>
        <span className="font-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
          Draft autosaves
        </span>
      </div>

      <div className="mt-6">
        <WizardShell data={data} />
      </div>
    </div>
  );
}
