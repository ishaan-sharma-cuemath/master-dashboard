import type { DerivedProject } from "../derive";
import { needsAttention } from "../derive";

export type FilterParams = {
  q?: string;
  folder?: string;
  tag?: string;
  owner?: string;
  health?: string; // 'green' | 'amber' | 'red' | 'alert'
  stale?: string;
  attention?: string;
  lifecycle?: string;
};

export function hasActiveFilters(sp: FilterParams): boolean {
  return Boolean(sp.q || sp.tag || sp.owner || sp.health || sp.stale || sp.attention || sp.lifecycle);
}

export function applyFilters(projects: DerivedProject[], sp: FilterParams): DerivedProject[] {
  let list = projects;

  if (sp.folder) list = list.filter((p) => p.folderId === sp.folder);
  if (sp.tag) list = list.filter((p) => p.tags.some((t) => t.id === sp.tag));
  if (sp.owner) {
    list = list.filter((p) => p.leadId === sp.owner || p.stages.some((s) => s.ownerId === sp.owner));
  }
  if (sp.lifecycle) list = list.filter((p) => p.lifecycle === sp.lifecycle);
  if (sp.stale) list = list.filter((p) => p.staleness === "stale");
  if (sp.attention) list = list.filter((p) => needsAttention(p));
  if (sp.health) {
    list = list.filter((p) => {
      const dh = p.displayHealth;
      if (sp.health === "alert") return dh.kind === "rag" && dh.health !== "on_track";
      if (dh.kind !== "rag") return false;
      return (
        (sp.health === "green" && dh.health === "on_track") ||
        (sp.health === "amber" && dh.health === "at_risk") ||
        (sp.health === "red" && dh.health === "off_track")
      );
    });
  }
  if (sp.q) {
    const q = sp.q.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.lead.name.toLowerCase().includes(q) ||
        p.tags.some((t) => t.name.toLowerCase().includes(q)) ||
        p.stages.some((s) => s.name.toLowerCase().includes(q)),
    );
  }
  return list;
}
