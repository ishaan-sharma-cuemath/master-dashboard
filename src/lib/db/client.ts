import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

function resolveDbPath(url: string | undefined): string {
  const raw = (url ?? "file:./data/dashboard.db").replace(/^file:/, "");
  const abs = path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  return abs;
}

function createDb(): BetterSQLite3Database<typeof schema> {
  const sqlite = new Database(resolveDbPath(process.env.DATABASE_URL));
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  // Idempotent, sub-ms when up to date — guarantees the schema exists in dev.
  try {
    migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  } catch {
    // Migrations folder absent (e.g. fresh checkout before db:generate) — seed script handles it.
  }
  return db;
}

// Cache across HMR reloads in dev so we don't leak connections.
const globalForDb = globalThis as unknown as { __db?: BetterSQLite3Database<typeof schema> };

export const db = globalForDb.__db ?? createDb();
if (process.env.NODE_ENV !== "production") globalForDb.__db = db;
