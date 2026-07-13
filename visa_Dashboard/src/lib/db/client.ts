import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

function resolveDbPath(url: string | undefined): string {
  const raw = (url ?? "file:./data/visa.db").replace(/^file:/, "");
  const abs = path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  return abs;
}

function createDb(): BetterSQLite3Database<typeof schema> {
  const sqlite = new Database(resolveDbPath(process.env.DATABASE_URL));
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const drizzled = drizzle(sqlite, { schema });
  // Idempotent, sub-ms when up to date — guarantees the schema exists.
  try {
    migrate(drizzled, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  } catch {
    // Migrations folder absent (e.g. fresh checkout before db:generate) — seed script handles it.
  }
  return drizzled;
}

// Cache across HMR reloads (dev) and reuse a single connection per process (prod).
const globalForDb = globalThis as unknown as { __db?: BetterSQLite3Database<typeof schema> };

function getDb(): BetterSQLite3Database<typeof schema> {
  if (!globalForDb.__db) globalForDb.__db = createDb();
  return globalForDb.__db;
}

// Open SQLite lazily, on first real use. `next build` imports route modules to
// analyze them; this proxy ensures that never opens a connection or creates the
// data directory — important on hosts (e.g. Render) where the persistent data
// disk isn't writable during the build step.
export const db = new Proxy({} as BetterSQLite3Database<typeof schema>, {
  get(_target, prop) {
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    const value = real[prop];
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(real) : value;
  },
});
