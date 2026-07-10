/**
 * Seed: evergreen demo data. All dates are relative to "now" so every
 * staleness state, the watermelon, the burn-up scope bump, and the
 * completed-this-month KPI demo correctly no matter when it runs.
 *
 * Always starts from a fresh database file.
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";
import type { Health } from "./schema";

const DB_PATH = path.join(process.cwd(), "data", "dashboard.db");

const DAY = 86_400_000;
const now = new Date();
const iso = (daysAgo: number) => new Date(now.getTime() - daysAgo * DAY).toISOString();
const ymd = (daysFromNow: number) =>
  new Date(now.getTime() + daysFromNow * DAY).toISOString().slice(0, 10);

// ——— fresh db ———
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
for (const suffix of ["", "-wal", "-shm"]) {
  if (fs.existsSync(DB_PATH + suffix)) fs.rmSync(DB_PATH + suffix);
}
const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite, { schema });
migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });

// ——— people ———
const PEOPLE = {
  akash: { name: "Akash", avatarColor: "#6366f1" },
  priya: { name: "Priya", avatarColor: "#0ea5e9" },
  rohan: { name: "Rohan", avatarColor: "#8b5cf6" },
  sneha: { name: "Sneha", avatarColor: "#ec4899" },
  vikram: { name: "Vikram", avatarColor: "#64748b" },
} as const;
type PersonKey = keyof typeof PEOPLE;

const personIds = {} as Record<PersonKey, string>;
for (const [key, p] of Object.entries(PEOPLE)) {
  const row = db.insert(schema.people).values(p).returning().get();
  personIds[key as PersonKey] = row.id;
}

// ——— folders ———
const FOLDERS = [
  { name: "Unsorted", isSystem: "unsorted" as const, sortOrder: 98 },
  { name: "Archive", isSystem: "archive" as const, sortOrder: 99 },
  { name: "Learning Products", color: "#6366f1", sortOrder: 0 },
  { name: "Growth & Marketing", color: "#0ea5e9", sortOrder: 1 },
  { name: "Internal Tools", color: "#8b5cf6", sortOrder: 2 },
];
const folderIds: Record<string, string> = {};
for (const f of FOLDERS) {
  const row = db.insert(schema.folders).values(f).returning().get();
  folderIds[f.name] = row.id;
}

// ——— tags ———
const domainGroup = db.insert(schema.tagGroups).values({ name: "Domain" }).returning().get();
const priorityGroup = db.insert(schema.tagGroups).values({ name: "Priority" }).returning().get();

const TAGS: { name: string; group?: string; definition?: string }[] = [
  { name: "curriculum", group: domainGroup.id, definition: "Learning content and pedagogy" },
  { name: "platform", group: domainGroup.id, definition: "Core product platform work" },
  { name: "ai", group: domainGroup.id, definition: "AI/ML powered features" },
  { name: "ops", group: domainGroup.id, definition: "Internal operations and tooling" },
  { name: "P0", group: priorityGroup.id, definition: "Drop everything" },
  { name: "P1", group: priorityGroup.id, definition: "This quarter" },
  { name: "P2", group: priorityGroup.id, definition: "When capacity allows" },
  { name: "q3-launch", definition: "Targeting the Q3 launch window" },
  { name: "tech-debt" },
];
const tagIds: Record<string, string> = {};
for (const t of TAGS) {
  const row = db
    .insert(schema.tags)
    .values({ name: t.name, tagGroupId: t.group ?? null, definition: t.definition })
    .returning()
    .get();
  tagIds[t.name] = row.id;
}

// ——— project specs ———
type StageSpec = {
  name: string;
  owner: PersonKey;
  /** target date, days from now (negative = past) */
  target: number;
  doneDaysAgo?: number;
  blocked?: boolean;
  /** stage added mid-flight (scope bump), days ago */
  addedDaysAgo?: number;
};
type UpdateSpec = {
  daysAgo: number;
  health: Health;
  note: string;
  author?: PersonKey;
  rtgAction?: string;
  rtgOwner?: PersonKey;
};
type ProjectSpec = {
  name: string;
  folder: string;
  lead: PersonKey;
  lifecycle: schema.Lifecycle;
  description: string;
  tags: string[];
  links?: schema.ExternalLink[];
  createdDaysAgo: number;
  startDaysAgo?: number;
  targetDaysAhead?: number;
  cadence?: number;
  archivedDaysAgo?: number;
  stages: StageSpec[];
  updates: UpdateSpec[];
};

const SPECS: ProjectSpec[] = [
  {
    // External-link demo + mid-flight scope bump for the burn-up chart
    name: "Cueword",
    folder: "Learning Products",
    lead: "priya",
    lifecycle: "in_progress",
    description:
      "# Cueword\n\nDaily word-puzzle product that teaches mathematical vocabulary through play. Has its **own dashboard** (linked here) for engagement metrics.\n\n## Goal\nShip GA before the school year starts, with a content pipeline that generates two weeks of puzzles ahead of schedule.",
    tags: ["curriculum", "P1", "q3-launch"],
    links: [{ label: "Cueword dashboard", url: "https://cueword.cuemath.com" }],
    createdDaysAgo: 42,
    startDaysAgo: 42,
    targetDaysAhead: 30,
    stages: [
      { name: "Spec & design", owner: "priya", target: -30, doneDaysAgo: 31 },
      { name: "Content pipeline", owner: "rohan", target: -14, doneDaysAgo: 12 },
      { name: "Beta", owner: "priya", target: 7 },
      { name: "Beta feedback loop", owner: "sneha", target: 16, addedDaysAgo: 21 },
      { name: "GA launch", owner: "priya", target: 28 },
    ],
    updates: [
      { daysAgo: 35, health: "on_track", note: "Design signed off, moving into the content pipeline." },
      { daysAgo: 26, health: "on_track", note: "Pipeline generating 40 puzzles/day, quality review holding." },
      { daysAgo: 19, health: "on_track", note: "Added a beta feedback loop stage after teacher council input — scope grew by one stage." },
      { daysAgo: 9, health: "on_track", note: "Pipeline done. Beta cohort of 200 students onboarding this week." },
      { daysAgo: 2, health: "on_track", note: "Beta engagement at 61% D7 — ahead of target." },
    ],
  },
  {
    // THE WATERMELON: reports green, current stage 12d past target
    name: "AI Tutor Pilot",
    folder: "Learning Products",
    lead: "rohan",
    lifecycle: "in_progress",
    description:
      "# AI Tutor Pilot\n\nConversational AI tutor pilot for grade 6–8 algebra. Testing whether guided Socratic hints improve problem-completion rates.\n\n## Success criteria\n+15% completion vs control across a 4-week pilot.",
    tags: ["ai", "P0"],
    createdDaysAgo: 38,
    startDaysAgo: 38,
    targetDaysAhead: 21,
    stages: [
      { name: "Model evaluation", owner: "rohan", target: -24, doneDaysAgo: 25 },
      { name: "Guardrails & safety", owner: "vikram", target: -12 },
      { name: "Classroom pilot", owner: "sneha", target: 10 },
      { name: "Readout", owner: "rohan", target: 20 },
    ],
    updates: [
      { daysAgo: 30, health: "on_track", note: "Eval done — GPT-class model with custom hint chain wins." },
      { daysAgo: 17, health: "on_track", note: "Guardrails underway, red-team session scheduled." },
      { daysAgo: 3, health: "on_track", note: "Still iterating on jailbreak coverage, feels close." },
    ],
  },
  {
    // Fresh green + blocked-by edge target
    name: "Parent App Notifications",
    folder: "Learning Products",
    lead: "sneha",
    lifecycle: "in_progress",
    description:
      "# Parent App Notifications\n\nWeekly progress digests and streak alerts for parents. Depends on the events schema from the Data Warehouse Migration.",
    tags: ["platform", "P1"],
    createdDaysAgo: 20,
    startDaysAgo: 20,
    targetDaysAhead: 25,
    stages: [
      { name: "Notification design", owner: "sneha", target: -8, doneDaysAgo: 9 },
      { name: "Event schema integration", owner: "vikram", target: 6, blocked: true },
      { name: "Rollout", owner: "sneha", target: 22 },
    ],
    updates: [
      { daysAgo: 12, health: "on_track", note: "Digest designs tested well with 8 parents." },
      { daysAgo: 1, health: "on_track", note: "Waiting on warehouse events schema — flagged as dependency." },
    ],
  },
  {
    // Planned = neutral dot, staleness-exempt
    name: "Math Olympiad Prep Module",
    folder: "Learning Products",
    lead: "priya",
    lifecycle: "planned",
    description:
      "# Math Olympiad Prep Module\n\nCompetition-prep track for advanced students: curated problem sets, timed mock rounds, and leaderboards. Kicks off after Cueword GA.",
    tags: ["curriculum", "P2"],
    createdDaysAgo: 15,
    targetDaysAhead: 90,
    stages: [
      { name: "Syllabus research", owner: "priya", target: 40 },
      { name: "Problem bank", owner: "rohan", target: 65 },
      { name: "Mock round engine", owner: "vikram", target: 85 },
    ],
    updates: [],
  },
  {
    // On hold — proves exemption from staleness decay despite 30d silence
    name: "LEAP Curriculum Revamp",
    folder: "Learning Products",
    lead: "priya",
    lifecycle: "on_hold",
    description:
      "# LEAP Curriculum Revamp\n\nGround-up refresh of the LEAP curriculum for the new NEP guidelines. **On hold** until the state board publishes final assessment norms.",
    tags: ["curriculum", "P2"],
    createdDaysAgo: 60,
    startDaysAgo: 60,
    stages: [
      { name: "Gap analysis", owner: "priya", target: -35, doneDaysAgo: 36 },
      { name: "Framework draft", owner: "priya", target: -10 },
      { name: "Pilot schools", owner: "sneha", target: 45 },
    ],
    updates: [
      { daysAgo: 36, health: "on_track", note: "Gap analysis complete." },
      { daysAgo: 30, health: "at_risk", note: "Board norms delayed — pausing until they publish.", rtgAction: "Resume when assessment norms land", rtgOwner: "priya" },
    ],
  },
  {
    // AGING: dashed ring (9d since update, cadence 7)
    name: "Referral Program",
    folder: "Growth & Marketing",
    lead: "sneha",
    lifecycle: "in_progress",
    description:
      "# Referral Program\n\nParent-to-parent referral loop with dual-sided rewards. Target: 12% of new signups via referral by end of quarter.",
    tags: ["platform", "P1"],
    createdDaysAgo: 33,
    startDaysAgo: 33,
    targetDaysAhead: 15,
    stages: [
      { name: "Incentive design", owner: "sneha", target: -20, doneDaysAgo: 22 },
      { name: "Referral flow build", owner: "vikram", target: 2 },
      { name: "Launch & measure", owner: "sneha", target: 14 },
    ],
    updates: [
      { daysAgo: 24, health: "on_track", note: "Reward structure locked: 1 free session each side." },
      { daysAgo: 9, health: "on_track", note: "Flow build in progress, share-sheet done." },
    ],
  },
  {
    // STALE: gray dot, "Awaiting update" (15d since update)
    name: "Website Revamp",
    folder: "Growth & Marketing",
    lead: "vikram",
    lifecycle: "in_progress",
    description:
      "# Website Revamp\n\nNew marketing site: faster pages, clearer program pages, localized pricing. SEO must not regress during the swap.",
    tags: ["platform", "P2"],
    createdDaysAgo: 45,
    startDaysAgo: 45,
    targetDaysAhead: 20,
    stages: [
      { name: "IA & content map", owner: "vikram", target: -30, doneDaysAgo: 32 },
      { name: "Design system", owner: "sneha", target: -15, doneDaysAgo: 18 },
      { name: "Build & migrate", owner: "vikram", target: 8 },
      { name: "SEO cutover", owner: "vikram", target: 18 },
    ],
    updates: [
      { daysAgo: 32, health: "on_track", note: "Content map approved." },
      { daysAgo: 15, health: "on_track", note: "Design system done, build starting." },
    ],
  },
  {
    // At-risk with road-to-green
    name: "Teacher Onboarding v2",
    folder: "Internal Tools",
    lead: "rohan",
    lifecycle: "in_progress",
    description:
      "# Teacher Onboarding v2\n\nCut teacher time-to-first-class from 9 days to 3: guided certification, auto-scheduling, and a practice sandbox.",
    tags: ["ops", "P1"],
    createdDaysAgo: 28,
    startDaysAgo: 28,
    targetDaysAhead: 18,
    stages: [
      { name: "Journey mapping", owner: "rohan", target: -16, doneDaysAgo: 18 },
      { name: "Certification flow", owner: "priya", target: -2 },
      { name: "Sandbox", owner: "vikram", target: 12 },
    ],
    updates: [
      { daysAgo: 20, health: "on_track", note: "Journey mapped, 3 drop-off points identified." },
      { daysAgo: 11, health: "on_track", note: "Certification flow half done." },
      {
        daysAgo: 5,
        health: "at_risk",
        note: "Assessment vendor API slower than promised — certification stage likely slips a week.",
        rtgAction: "Vendor escalation call Friday; fallback is manual review batch",
        rtgOwner: "rohan",
      },
    ],
  },
  {
    // Off-track — tops the Needs Attention queue
    name: "Data Warehouse Migration",
    folder: "Internal Tools",
    lead: "vikram",
    lifecycle: "in_progress",
    description:
      "# Data Warehouse Migration\n\nMove analytics from the legacy warehouse to the new events platform. Blocks Parent App Notifications and two BI dashboards.",
    tags: ["ops", "P0", "tech-debt"],
    createdDaysAgo: 50,
    startDaysAgo: 50,
    targetDaysAhead: 10,
    stages: [
      { name: "Schema design", owner: "vikram", target: -35, doneDaysAgo: 37 },
      { name: "Backfill pipelines", owner: "vikram", target: -7 },
      { name: "Consumer cutover", owner: "rohan", target: 8 },
    ],
    updates: [
      { daysAgo: 40, health: "on_track", note: "Events schema approved." },
      { daysAgo: 21, health: "at_risk", note: "Backfill throughput 3× slower than planned.", rtgAction: "Parallelize by month partitions", rtgOwner: "vikram" },
      {
        daysAgo: 1,
        health: "off_track",
        note: "Backfill hit data-quality issues in 2019–21 records; cutover date is not holding.",
        rtgAction: "Need Akash's call: skip pre-2022 history or add 2 weeks",
        rtgOwner: "akash",
      },
    ],
  },
  {
    // Backlog orphan in Unsorted — graph orphan + triage demo
    name: "Hiring Pipeline Dashboard",
    folder: "Unsorted",
    lead: "akash",
    lifecycle: "backlog",
    description:
      "# Hiring Pipeline Dashboard\n\nSingle view of teacher-hiring funnel across sourcing partners. Parked idea — needs an owner.",
    tags: [],
    createdDaysAgo: 10,
    stages: [],
    updates: [],
  },
  {
    // Completed this month, archived — KPI + excluded from active views
    name: "Billing Consolidation",
    folder: "Archive",
    lead: "vikram",
    lifecycle: "completed",
    description:
      "# Billing Consolidation\n\nMerged three payment providers into one. Shipped: fee overhead down 0.8%, reconciliation now automatic.",
    tags: ["ops", "tech-debt"],
    createdDaysAgo: 80,
    startDaysAgo: 80,
    archivedDaysAgo: 6,
    stages: [
      { name: "Provider selection", owner: "vikram", target: -60, doneDaysAgo: 62 },
      { name: "Migration", owner: "vikram", target: -20, doneDaysAgo: 21 },
      { name: "Decommission legacy", owner: "rohan", target: -8, doneDaysAgo: 6 },
    ],
    updates: [
      { daysAgo: 62, health: "on_track", note: "Provider picked after bake-off." },
      { daysAgo: 21, health: "on_track", note: "All plans migrated, zero failed renewals." },
      { daysAgo: 6, health: "on_track", note: "Legacy decommissioned. Done. 🎉" },
    ],
  },
];

// ——— insert projects with replayed history ———
const projectIds: Record<string, string> = {};

for (const spec of SPECS) {
  const project = db
    .insert(schema.projects)
    .values({
      name: spec.name,
      description: spec.description,
      folderId: folderIds[spec.folder],
      leadId: personIds[spec.lead],
      lifecycle: spec.lifecycle,
      startDate: spec.startDaysAgo !== undefined ? ymd(-spec.startDaysAgo) : null,
      targetDate: spec.targetDaysAhead !== undefined ? ymd(spec.targetDaysAhead) : null,
      externalLinks: spec.links ?? [],
      updateCadenceDays: spec.cadence ?? 7,
      archivedAt: spec.archivedDaysAgo !== undefined ? iso(spec.archivedDaysAgo) : null,
      createdAt: iso(spec.createdDaysAgo),
      updatedAt: iso(spec.updates[0] ? Math.min(...spec.updates.map((u) => u.daysAgo)) : spec.createdDaysAgo),
    })
    .returning()
    .get();
  projectIds[spec.name] = project.id;

  for (const tagName of spec.tags) {
    db.insert(schema.projectTags).values({ projectId: project.id, tagId: tagIds[tagName] }).run();
  }

  // Stages with final states
  const doneStages = new Set(spec.stages.filter((s) => s.doneDaysAgo !== undefined).map((s) => s.name));
  let currentAssigned = false;
  const stageRows = spec.stages.map((s, i) => {
    let state: schema.StageState = "pending";
    if (doneStages.has(s.name)) state = "done";
    else if (!currentAssigned) {
      state = s.blocked ? "blocked" : "current";
      currentAssigned = true;
    }
    const row = db
      .insert(schema.stages)
      .values({
        projectId: project.id,
        name: s.name,
        sortOrder: i,
        ownerId: personIds[s.owner],
        targetDate: ymd(s.target),
        state,
        completedAt: s.doneDaysAgo !== undefined ? iso(s.doneDaysAgo) : null,
      })
      .returning()
      .get();
    return { ...row, spec: s };
  });

  // Replay history → snapshots at creation, each stage completion, each update
  const stageExistsAt = (s: StageSpec, daysAgo: number) =>
    s.addedDaysAgo === undefined ? true : s.addedDaysAgo >= daysAgo;
  const stageDoneAt = (s: StageSpec, daysAgo: number) =>
    s.doneDaysAgo !== undefined && s.doneDaysAgo >= daysAgo;

  const snapshotAt = (daysAgo: number) => {
    const existing = spec.stages.filter((s) => stageExistsAt(s, daysAgo));
    const done = existing.filter((s) => stageDoneAt(s, daysAgo));
    const hasRemaining = existing.length > done.length;
    db.insert(schema.progressSnapshots).values({
      projectId: project.id,
      takenAt: iso(daysAgo),
      scopeTotal: existing.length,
      completed: done.length + (hasRemaining ? 0.5 : 0),
      stageIndex: done.length,
    }).run();
  };

  if (spec.stages.length > 0) {
    snapshotAt(spec.createdDaysAgo);
    const events = new Set<number>();
    for (const s of spec.stages) {
      if (s.doneDaysAgo !== undefined) events.add(s.doneDaysAgo);
      if (s.addedDaysAgo !== undefined) events.add(s.addedDaysAgo);
    }
    for (const u of spec.updates) events.add(u.daysAgo);
    for (const d of [...events].sort((a, b) => b - a)) snapshotAt(d);
  }

  // Status updates, newest last; auto-changes = stages completed since previous update
  const sortedUpdates = [...spec.updates].sort((a, b) => b.daysAgo - a.daysAgo);
  sortedUpdates.forEach((u, idx) => {
    const prevDaysAgo = idx === 0 ? spec.createdDaysAgo : sortedUpdates[idx - 1].daysAgo;
    const completedSince = spec.stages.filter(
      (s) => s.doneDaysAgo !== undefined && s.doneDaysAgo < prevDaysAgo && s.doneDaysAgo >= u.daysAgo,
    );
    const autoChanges: schema.AutoChange[] = completedSince.map((s) => ({
      kind: "stage_done",
      detail: `Stage “${s.name}” completed`,
    }));
    const addedSince = spec.stages.filter(
      (s) => s.addedDaysAgo !== undefined && s.addedDaysAgo < prevDaysAgo && s.addedDaysAgo >= u.daysAgo,
    );
    for (const s of addedSince) {
      autoChanges.push({ kind: "progress_delta", detail: `Stage “${s.name}” added — scope grew` });
    }

    // current stage at that time = first existing, not-yet-done stage
    const currentSpec = spec.stages.find((s) => stageExistsAt(s, u.daysAgo) && !stageDoneAt(s, u.daysAgo));
    const currentRow = currentSpec ? stageRows.find((r) => r.name === currentSpec.name) : undefined;

    db.insert(schema.statusUpdates).values({
      projectId: project.id,
      authorId: personIds[u.author ?? spec.lead],
      createdAt: iso(u.daysAgo),
      health: u.health,
      note: u.note,
      roadToGreenAction: u.rtgAction ?? null,
      roadToGreenOwnerId: u.rtgOwner ? personIds[u.rtgOwner] : null,
      currentStageId: currentRow?.id ?? null,
      autoChanges,
    }).run();
  });
}

// ——— relations ———
const RELATIONS: [string, string, "related" | "blocks"][] = [
  ["Cueword", "LEAP Curriculum Revamp", "related"],
  ["Cueword", "AI Tutor Pilot", "related"],
  ["Data Warehouse Migration", "Parent App Notifications", "blocks"],
  ["Referral Program", "Website Revamp", "related"],
];
for (const [from, to, type] of RELATIONS) {
  db.insert(schema.relations).values({
    fromProjectId: projectIds[from],
    toProjectId: projectIds[to],
    type,
  }).run();
}

// ——— report ———
const count = (table: string) =>
  (sqlite.prepare(`select count(*) as c from ${table}`).get() as { c: number }).c;
console.log(
  [
    `Seeded ${DB_PATH}`,
    `  people:             ${count("people")}`,
    `  folders:            ${count("folders")}`,
    `  tags:               ${count("tags")}`,
    `  projects:           ${count("projects")}`,
    `  stages:             ${count("stages")}`,
    `  relations:          ${count("relations")}`,
    `  status_updates:     ${count("status_updates")}`,
    `  progress_snapshots: ${count("progress_snapshots")}`,
  ].join("\n"),
);
sqlite.close();
