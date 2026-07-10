import type { DisplayHealth } from "../derive";
import type { Workspace } from "./projects";

/**
 * One flat, JSON-serializable index for the command palette.
 * Built server-side from the workspace view-model and passed down as props —
 * the palette itself never fetches.
 */
export type SearchItem = {
  type: "project" | "folder" | "tag" | "person";
  id: string;
  label: string;
  sublabel?: string;
  href: string;
  keywords: string[];
  /** projects only — drives the glyph in the palette */
  health?: DisplayHealth;
  /** projects only — ISO timestamp of the latest activity, for recency ranking */
  updatedAt?: string;
};

export function buildSearchIndex(ws: Workspace): SearchItem[] {
  const foldersById = new Map(ws.folders.map((f) => [f.id, f]));

  const projectItems: SearchItem[] = ws.projects
    .map((p): SearchItem => {
      const keywords = [
        foldersById.get(p.folderId)?.name ?? "",
        p.lead.name,
        p.lifecycle.replace("_", " "),
        ...p.stages.map((s) => s.name),
        ...p.tags.map((t) => t.name),
        p.latestUpdate?.note.slice(0, 120) ?? "",
      ].filter(Boolean);
      return {
        type: "project",
        id: p.id,
        label: p.name,
        sublabel: foldersById.get(p.folderId)?.name,
        href: `/projects/${p.id}`,
        keywords,
        health: p.displayHealth,
        updatedAt: p.latestUpdate?.createdAt ?? p.updatedAt,
      };
    })
    // Most recently updated first — the palette's empty-query default shows the top 5.
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));

  const folderItems: SearchItem[] = ws.folders.map((f) => ({
    type: "folder",
    id: f.id,
    label: f.name,
    sublabel: "Folder",
    href: `/?folder=${f.id}`,
    keywords: [f.name, "folder"],
  }));

  const tagItems: SearchItem[] = ws.tags.map((t) => ({
    type: "tag",
    id: t.id,
    label: t.name,
    sublabel: "Tag",
    href: `/?tag=${t.id}`,
    keywords: [t.name, t.definition ?? "", "tag"].filter(Boolean),
  }));

  const personItems: SearchItem[] = ws.people.map((p) => ({
    type: "person",
    id: p.id,
    label: p.name,
    sublabel: "Person",
    href: `/?owner=${p.id}`,
    keywords: [p.name, "person", "owner", "lead"],
  }));

  return [...projectItems, ...folderItems, ...tagItems, ...personItems];
}
