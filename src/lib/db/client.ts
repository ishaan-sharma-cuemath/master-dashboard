import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "node:fs";
import path from "node:path";
import { ensureBootstrap } from "./bootstrap";
import * as schema from "./schema";

type DB = BetterSQLite3Database<typeof schema>;

function resolveDbPath(url: string | undefined): string {
  const raw = (url ?? "file:./data/dashboard.db").replace(/^file:/, "");
  const abs = path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  return abs;
}

function createDb(): DB {
  const sqlite = new Database(resolveDbPath(process.env.DATABASE_URL));
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const instance = drizzle(sqlite, { schema });
  // Idempotent, sub-ms when up to date — guarantees the schema exists, including
  // on a freshly-mounted prod disk on first boot.
  try {
    migrate(instance, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  } catch {
    // Migrations folder absent (e.g. before db:generate) — seed script handles it.
  }
  // First-boot seed on a fresh DB (e.g. a new Render disk); no-op otherwise.
  try {
    ensureBootstrap(instance);
  } catch {
    // Best-effort — never block startup on seeding.
  }
  return instance;
}

// Cache across dev HMR reloads (and within a prod process) so we don't leak connections.
const globalForDb = globalThis as unknown as { __db?: DB };

/**
 * Lazily open the connection on FIRST USE — never at module load. `next build`
 * imports this module while collecting page data; opening the DB there would
 * touch the filesystem and can fail on a not-yet-mounted Render disk. Deferring
 * to first query means the DB only opens at runtime, when /data is mounted.
 */
function getDb(): DB {
  if (!globalForDb.__db) globalForDb.__db = createDb();
  return globalForDb.__db;
}

export const db = new Proxy({} as DB, {
  get(_target, prop, receiver) {
    const instance = getDb() as unknown as Record<string | symbol, unknown>;
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(instance) : value;
  },
});
