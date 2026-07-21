import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const pk = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const nowIso = () => new Date().toISOString();

export const LIFECYCLES = ["backlog", "planned", "in_progress", "on_hold", "completed", "cancelled"] as const;
export type Lifecycle = (typeof LIFECYCLES)[number];

export const HEALTHS = ["on_track", "at_risk", "off_track"] as const;
export type Health = (typeof HEALTHS)[number];

export const STAGE_STATES = ["pending", "current", "done", "blocked"] as const;
export type StageState = (typeof STAGE_STATES)[number];

/** How a project's progress is meaningfully expressed. Only `health` is normalized across shapes. */
export const SHAPES = ["linear", "pipeline", "metric", "other"] as const;
export type Shape = (typeof SHAPES)[number];

export type StatusSegment = { label: string; value: number };

export type ExternalLink = { label: string; url: string };
export type AutoChange = {
  kind: "stage_done" | "target_moved" | "owner_changed" | "progress_delta";
  detail: string;
};

export const people = sqliteTable("people", {
  id: pk(),
  name: text("name").notNull(),
  avatarColor: text("avatar_color").notNull().default("#6366f1"),
  createdAt: text("created_at").notNull().$defaultFn(nowIso),
});

export const folders = sqliteTable("folders", {
  id: pk(),
  name: text("name").notNull().unique(),
  color: text("color"),
  sortOrder: integer("sort_order").notNull().default(0),
  isSystem: text("is_system", { enum: ["unsorted", "archive"] }),
});

export const tagGroups = sqliteTable("tag_groups", {
  id: pk(),
  name: text("name").notNull().unique(),
});

export const tags = sqliteTable("tags", {
  id: pk(),
  name: text("name").notNull().unique(),
  tagGroupId: text("tag_group_id").references(() => tagGroups.id, { onDelete: "set null" }),
  definition: text("definition"),
});

export const projects = sqliteTable(
  "projects",
  {
    id: pk(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    folderId: text("folder_id")
      .notNull()
      .references(() => folders.id),
    leadId: text("lead_id")
      .notNull()
      .references(() => people.id),
    lifecycle: text("lifecycle", { enum: LIFECYCLES }).notNull().default("in_progress"),
    // Shape decides how status is shown: linear → stages+%, pipeline → breakdown,
    // metric → value vs goal, other → status line only.
    shape: text("shape", { enum: SHAPES }).notNull().default("linear"),
    // Project owner contact — the person who runs this project's portal and
    // receives "ask for status" emails.
    ownerName: text("owner_name"),
    ownerEmail: text("owner_email"),
    // The portal reports its status UP via this endpoint (GET → health+json).
    statusEndpoint: text("status_endpoint"),
    statusToken: text("status_token"), // optional bearer token the portal expects
    startDate: text("start_date"),
    targetDate: text("target_date"),
    externalLinks: text("external_links", { mode: "json" }).$type<ExternalLink[]>().notNull().default([]),
    updateCadenceDays: integer("update_cadence_days").notNull().default(7),
    pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
    graphX: real("graph_x"),
    graphY: real("graph_y"),
    archivedAt: text("archived_at"),
    // Oversight actions (set by Akash/Ishaan on the central dashboard)
    flagged: integer("flagged", { mode: "boolean" }).notNull().default(false),
    flagNote: text("flag_note"),
    flaggedAt: text("flagged_at"),
    statusRequestedAt: text("status_requested_at"),
    createdAt: text("created_at").notNull().$defaultFn(nowIso),
    updatedAt: text("updated_at").notNull().$defaultFn(nowIso),
  },
  (t) => [index("projects_folder_idx").on(t.folderId), index("projects_lifecycle_idx").on(t.lifecycle)],
);

export const projectTags = sqliteTable(
  "project_tags",
  {
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.tagId] }), index("project_tags_tag_idx").on(t.tagId)],
);

export const stages = sqliteTable(
  "stages",
  {
    id: pk(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => people.id),
    targetDate: text("target_date"),
    weight: real("weight").notNull().default(1),
    state: text("state", { enum: STAGE_STATES }).notNull().default("pending"),
    completedAt: text("completed_at"),
  },
  (t) => [index("stages_project_idx").on(t.projectId, t.sortOrder)],
);

export const relations = sqliteTable(
  "relations",
  {
    id: pk(),
    fromProjectId: text("from_project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    toProjectId: text("to_project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["related", "blocks"] }).notNull().default("related"),
  },
  (t) => [
    uniqueIndex("relations_unique_idx").on(t.fromProjectId, t.toProjectId, t.type),
    index("relations_to_idx").on(t.toProjectId),
  ],
);

export const statusUpdates = sqliteTable(
  "status_updates",
  {
    id: pk(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => people.id),
    createdAt: text("created_at").notNull().$defaultFn(nowIso),
    health: text("health", { enum: HEALTHS }).notNull(),
    note: text("note").notNull(),
    roadToGreenAction: text("road_to_green_action"),
    roadToGreenOwnerId: text("road_to_green_owner_id").references(() => people.id),
    currentStageId: text("current_stage_id").references(() => stages.id, { onDelete: "set null" }),
    autoChanges: text("auto_changes", { mode: "json" }).$type<AutoChange[]>().notNull().default([]),
  },
  (t) => [index("updates_project_time_idx").on(t.projectId, t.createdAt)],
);

export const progressSnapshots = sqliteTable(
  "progress_snapshots",
  {
    id: pk(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    takenAt: text("taken_at").notNull().$defaultFn(nowIso),
    scopeTotal: real("scope_total").notNull(),
    completed: real("completed").notNull(),
    stageIndex: integer("stage_index").notNull(),
  },
  (t) => [index("snapshots_project_time_idx").on(t.projectId, t.takenAt)],
);

/** Cached snapshot of a portal's self-reported status (from its GET /api/status). */
export const projectStatus = sqliteTable("project_status", {
  projectId: text("project_id")
    .primaryKey()
    .references(() => projects.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["pass", "warn", "fail", "unknown"] }).notNull().default("unknown"),
  progress: integer("progress"), // 0–100 (linear projects only)
  stage: text("stage"), // linear projects only
  summary: text("summary"), // the source-written status line (all shapes)
  // Optional source-defined headline metric (never compared across projects)
  metricLabel: text("metric_label"),
  metricValue: real("metric_value"),
  metricTarget: real("metric_target"),
  metricUnit: text("metric_unit"),
  // Optional breakdown for pipeline shapes → outcome donut / segmented bar
  segments: text("segments", { mode: "json" }).$type<StatusSegment[]>(),
  // Optional current distribution across stages → funnel / stage bars
  stageCounts: text("stage_counts", { mode: "json" }).$type<StatusSegment[]>(),
  // Optional recent value history for metric shapes → trend sparkline
  history: text("history", { mode: "json" }).$type<number[]>(),
  rawJson: text("raw_json"),
  portalUpdatedAt: text("portal_updated_at"),
  lastCheckedAt: text("last_checked_at"),
  lastSuccessAt: text("last_success_at"),
  consecutiveFailures: integer("consecutive_failures").notNull().default(0),
});

export type ProjectStatusRow = typeof projectStatus.$inferSelect;

export type PersonRow = typeof people.$inferSelect;
export type FolderRow = typeof folders.$inferSelect;
export type TagGroupRow = typeof tagGroups.$inferSelect;
export type TagRow = typeof tags.$inferSelect;
export type ProjectRow = typeof projects.$inferSelect;
export type StageRow = typeof stages.$inferSelect;
export type RelationRow = typeof relations.$inferSelect;
export type StatusUpdateRow = typeof statusUpdates.$inferSelect;
export type ProgressSnapshotRow = typeof progressSnapshots.$inferSelect;
