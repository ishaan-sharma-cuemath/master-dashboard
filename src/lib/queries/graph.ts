import { healthWord } from "@/components/health/HealthGlyph";
import type { DisplayHealth } from "../derive";
import type { Workspace } from "./projects";

/**
 * Pure view-model for the force graph. Everything here must be
 * JSON-serializable — it crosses the server → client boundary.
 */

export type GraphHealthKey = "green" | "amber" | "red" | "stale" | "neutral" | "completed";

export type GraphNode = {
  id: string;
  kind: "project" | "folder" | "tag";
  name: string;
  /** project only */
  healthKey?: GraphHealthKey;
  /** project only — 0..1 */
  progress?: number;
  /** project only — tooltip copy */
  healthWord?: string;
  /** project only — current stage name, when one exists */
  sublabel?: string;
  /** folder only */
  color?: string | null;
  /** pinned position (projects.graphX/graphY) */
  fx?: number;
  fy?: number;
};

export type GraphLink = {
  source: string;
  target: string;
  kind: "membership" | "tag" | "related" | "blocks";
};

export type GraphData = { nodes: GraphNode[]; links: GraphLink[] };

function toHealthKey(dh: DisplayHealth): GraphHealthKey {
  switch (dh.kind) {
    case "rag":
      return dh.health === "on_track" ? "green" : dh.health === "at_risk" ? "amber" : "red";
    case "stale":
      return "stale";
    case "completed":
      return "completed";
    case "neutral":
    case "cancelled":
      return "neutral";
  }
}

export function buildGraphData(ws: Workspace): GraphData {
  const archiveFolderId = ws.folders.find((f) => f.isSystem === "archive")?.id;
  const active = ws.projects.filter((p) => p.folderId !== archiveFolderId && !p.archivedAt);
  const activeIds = new Set(active.map((p) => p.id));

  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  // Folders — every non-system folder gets a hub node.
  const folderIds = new Set<string>();
  for (const f of ws.folders) {
    if (f.isSystem) continue;
    folderIds.add(f.id);
    nodes.push({ id: f.id, kind: "folder", name: f.name, color: f.color });
  }

  // Projects — every non-archived project.
  for (const p of active) {
    const node: GraphNode = {
      id: p.id,
      kind: "project",
      name: p.name,
      healthKey: toHealthKey(p.displayHealth),
      progress: p.progressPct / 100,
      healthWord: healthWord(p.displayHealth, p.lifecycle),
    };
    if (p.currentStage) node.sublabel = p.currentStage.name;
    if (p.graphX !== null && p.graphY !== null) {
      node.fx = p.graphX;
      node.fy = p.graphY;
    }
    nodes.push(node);
    if (folderIds.has(p.folderId)) {
      links.push({ source: p.id, target: p.folderId, kind: "membership" });
    }
  }

  // Tags — only those attached to ≥1 active project.
  const seenTags = new Set<string>();
  for (const p of active) {
    for (const t of p.tags) {
      if (!seenTags.has(t.id)) {
        seenTags.add(t.id);
        nodes.push({ id: t.id, kind: "tag", name: t.name });
      }
      links.push({ source: p.id, target: t.id, kind: "tag" });
    }
  }

  // Project ↔ project relations (each stored edge once, via its "out" side).
  for (const [fromId, rels] of ws.relationsByProject) {
    if (!activeIds.has(fromId)) continue;
    for (const r of rels) {
      if (r.direction !== "out" || !activeIds.has(r.project.id)) continue;
      links.push({ source: fromId, target: r.project.id, kind: r.type });
    }
  }

  return { nodes, links };
}
