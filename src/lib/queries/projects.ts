import { desc } from "drizzle-orm";
import { db } from "../db/client";
import {
  folders,
  people,
  projects,
  projectTags,
  relations,
  stages,
  statusUpdates,
  tags,
  type FolderRow,
  type PersonRow,
  type TagRow,
} from "../db/schema";
import {
  daysSince,
  getCurrentStage,
  getDisplayHealth,
  getProgress,
  getScheduleSignal,
  getStaleness,
  isWatermelon,
  type DerivedProject,
  type RelatednessContext,
} from "../derive";

export type Workspace = {
  projects: DerivedProject[];
  folders: FolderRow[];
  people: PersonRow[];
  tags: TagRow[];
  tagGroupIds: Set<string>;
  relatedness: RelatednessContext;
  /** projectId → [{project, type, direction}] */
  relationsByProject: Map<string, { project: DerivedProject; type: "related" | "blocks"; direction: "out" | "in" }[]>;
};

/** Assembles the full view-model in a handful of sync queries — the dataset is tiny. */
export function getWorkspace(now: Date = new Date()): Workspace {
  const projectRows = db.select().from(projects).all();
  const folderRows = db.select().from(folders).all();
  const peopleRows = db.select().from(people).all();
  const tagRows = db.select().from(tags).all();
  const ptRows = db.select().from(projectTags).all();
  const stageRows = db.select().from(stages).all();
  const relRows = db.select().from(relations).all();
  const updateRows = db.select().from(statusUpdates).orderBy(desc(statusUpdates.createdAt)).all();

  const peopleById = new Map(peopleRows.map((p) => [p.id, p]));
  const tagsById = new Map(tagRows.map((t) => [t.id, t]));

  const stagesByProject = new Map<string, typeof stageRows>();
  for (const s of stageRows) {
    const list = stagesByProject.get(s.projectId) ?? [];
    list.push(s);
    stagesByProject.set(s.projectId, list);
  }
  for (const list of stagesByProject.values()) list.sort((a, b) => a.sortOrder - b.sortOrder);

  const tagsByProject = new Map<string, TagRow[]>();
  for (const pt of ptRows) {
    const tag = tagsById.get(pt.tagId);
    if (!tag) continue;
    const list = tagsByProject.get(pt.projectId) ?? [];
    list.push(tag);
    tagsByProject.set(pt.projectId, list);
  }

  // updateRows are newest-first, so the first hit per project is the latest
  const latestUpdateByProject = new Map<string, (typeof updateRows)[number]>();
  for (const u of updateRows) {
    if (!latestUpdateByProject.has(u.projectId)) latestUpdateByProject.set(u.projectId, u);
  }

  // Relatedness context
  const relMap = new Map<string, Set<string>>();
  const addRel = (a: string, b: string) => {
    if (!relMap.has(a)) relMap.set(a, new Set());
    relMap.get(a)!.add(b);
  };
  for (const r of relRows) {
    addRel(r.fromProjectId, r.toProjectId);
    addRel(r.toProjectId, r.fromProjectId);
  }
  const facetTags = new Map<string, Set<string>>();
  for (const [pid, list] of tagsByProject) {
    facetTags.set(pid, new Set(list.filter((t) => t.tagGroupId !== null).map((t) => t.id)));
  }
  const peopleByProject = new Map<string, Set<string>>();
  for (const p of projectRows) {
    const set = new Set<string>([p.leadId]);
    for (const s of stagesByProject.get(p.id) ?? []) set.add(s.ownerId);
    peopleByProject.set(p.id, set);
  }
  const relatedness: RelatednessContext = { relations: relMap, facetTags, people: peopleByProject };

  const derived: DerivedProject[] = projectRows.map((p) => {
    const pStages = stagesByProject.get(p.id) ?? [];
    const latestUpdate = latestUpdateByProject.get(p.id) ?? null;
    const staleness = getStaleness(latestUpdate?.createdAt ?? null, p.updateCadenceDays, p.lifecycle, now);
    const displayHealth = getDisplayHealth(p.lifecycle, latestUpdate, staleness);
    const { signal, daysBehind } = getScheduleSignal(pStages, now);
    return {
      ...p,
      stages: pStages,
      tags: tagsByProject.get(p.id) ?? [],
      lead: peopleById.get(p.leadId)!,
      latestUpdate,
      displayHealth,
      staleness,
      progressPct: Math.round(getProgress(pStages) * 100),
      currentStage: getCurrentStage(pStages),
      scheduleSignal: signal,
      daysBehind,
      isWatermelon: isWatermelon(displayHealth, signal),
      daysSinceUpdate: daysSince(latestUpdate?.createdAt ?? null, now),
    };
  });

  const derivedById = new Map(derived.map((d) => [d.id, d]));
  const relationsByProject: Workspace["relationsByProject"] = new Map();
  for (const r of relRows) {
    const from = derivedById.get(r.fromProjectId);
    const to = derivedById.get(r.toProjectId);
    if (!from || !to) continue;
    if (!relationsByProject.has(from.id)) relationsByProject.set(from.id, []);
    if (!relationsByProject.has(to.id)) relationsByProject.set(to.id, []);
    relationsByProject.get(from.id)!.push({ project: to, type: r.type, direction: "out" });
    relationsByProject.get(to.id)!.push({ project: from, type: r.type, direction: "in" });
  }

  return {
    projects: derived,
    folders: folderRows.sort((a, b) => a.sortOrder - b.sortOrder),
    people: peopleRows,
    tags: tagRows,
    tagGroupIds: new Set(tagRows.filter((t) => t.tagGroupId).map((t) => t.tagGroupId!)),
    relatedness,
    relationsByProject,
  };
}
