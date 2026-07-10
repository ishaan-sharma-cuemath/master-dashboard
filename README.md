# Master Dashboard

A central mission-control for tracking many projects at once — their status, progress, stages, and owners — in one calm, clean place.

## What it does

- **Home** — every project as a clean tile grouped by folder, each with a colored status dot (🟢 on track · 🟡 at risk · 🔴 off track · ⚪ awaiting update), owner, and a thin stage-progress bar.
- **List / Graph views** — scan projects as tiles, or explore how they connect in an Obsidian-style force graph (projects, folders, and relationships as nodes).
- **Project page** — a plain description, the stage pipeline (current level + % complete), a prominent link to open the project's own external dashboard, and a status-update log.
- **Folders & tags** — group related projects; the home page orders each folder by relatedness.
- **Health model** — status is set in a written update (amber/red require a "road to green"); a project that hasn't been updated in a while decays to a grey "awaiting update" dot, so stale-but-green projects can't hide.
- **Search** and **light / dark** themes throughout.

## Tech stack

- **Next.js** (App Router, TypeScript) + **Tailwind CSS v4**
- **SQLite** via **Drizzle ORM** (`data/dashboard.db`, git-ignored) — swappable to Postgres/Supabase via `DATABASE_URL`
- **react-force-graph-2d** for the graph view

## Getting started

```bash
npm install
npm run db:generate   # generate migrations from the schema
npm run db:migrate    # apply them (creates data/dashboard.db)
npm run dev           # http://localhost:3001
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run db:migrate` | Apply database migrations |
| `npm test` | Run the derive-layer unit tests (Vitest) |
