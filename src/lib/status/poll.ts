import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { projects, projectStatus, type ProjectStatusRow } from "@/lib/db/schema";

/** Portals may report health+json ("pass"|"warn"|"fail") or plain RAG words — normalize both. */
function normalizeStatus(raw: unknown): "pass" | "warn" | "fail" | "unknown" {
  const s = String(raw ?? "").toLowerCase().trim();
  if (["pass", "ok", "healthy", "on_track", "on track", "green", "up"].includes(s)) return "pass";
  if (["warn", "warning", "at_risk", "at risk", "amber", "yellow", "degraded"].includes(s)) return "warn";
  if (["fail", "failed", "off_track", "off track", "red", "down", "critical", "severe"].includes(s)) return "fail";
  return "unknown";
}

function clampProgress(v: unknown): number | null {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Optional source-defined headline metric: { label, value, target?, unit? } */
function parseMetric(m: unknown): { label: string | null; value: number | null; target: number | null; unit: string | null } {
  if (!m || typeof m !== "object") return { label: null, value: null, target: null, unit: null };
  const o = m as Record<string, unknown>;
  return {
    label: o.label != null ? String(o.label) : null,
    value: num(o.value),
    target: num(o.target),
    unit: o.unit != null ? String(o.unit) : null,
  };
}

/** Optional pipeline breakdown → segmented bar. */
function parseSegments(s: unknown): { label: string; value: number }[] | null {
  if (!Array.isArray(s)) return null;
  const out = s
    .map((x) => (x && typeof x === "object" ? { label: String((x as Record<string, unknown>).label ?? ""), value: num((x as Record<string, unknown>).value) ?? 0 } : null))
    .filter((x): x is { label: string; value: number } => x != null && x.label.length > 0);
  return out.length ? out : null;
}

const POLL_TIMEOUT_MS = 5000;

export type PollOutcome = { projectId: string; name: string; ok: boolean; status: string; reason?: string };

/**
 * Fetch one portal's /api/status and upsert the cached snapshot.
 * On any failure (timeout, non-2xx, bad JSON), KEEP the last good values —
 * only bump the failure counter — so a portal going dark never fakes green.
 */
export async function pollProject(
  project: {
    id: string;
    name: string;
    statusEndpoint: string | null;
    statusToken: string | null;
  },
  baseUrl?: string,
): Promise<PollOutcome> {
  if (!project.statusEndpoint) return { projectId: project.id, name: project.name, ok: false, status: "unknown", reason: "no endpoint" };

  // Relative endpoints (e.g. "/api/status-example") resolve against the app's own origin,
  // so the same stored value works on localhost and in production.
  const url = project.statusEndpoint.startsWith("/")
    ? new URL(project.statusEndpoint, baseUrl ?? "http://localhost:3001").toString()
    : project.statusEndpoint;

  const now = new Date().toISOString();
  const prev = db.select().from(projectStatus).where(eq(projectStatus.projectId, project.id)).get();
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), POLL_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: ac.signal,
      headers: {
        Accept: "application/health+json, application/json",
        ...(project.statusToken ? { Authorization: `Bearer ${project.statusToken}` } : {}),
      },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as Record<string, unknown>;

    const metric = parseMetric(body.metric);
    const row: ProjectStatusRow = {
      projectId: project.id,
      status: normalizeStatus(body.status),
      progress: clampProgress(body.progress),
      stage: body.stage != null ? String(body.stage) : null,
      summary: (body.summary ?? body.statusLine) != null ? String(body.summary ?? body.statusLine) : null,
      metricLabel: metric.label,
      metricValue: metric.value,
      metricTarget: metric.target,
      metricUnit: metric.unit,
      segments: parseSegments(body.segments),
      stageCounts: parseSegments(body.stageCounts),
      history: Array.isArray(body.history) ? body.history.map(Number).filter((n) => Number.isFinite(n)) : null,
      rawJson: JSON.stringify(body).slice(0, 4000),
      portalUpdatedAt: body.updatedAt != null ? String(body.updatedAt) : null,
      lastCheckedAt: now,
      lastSuccessAt: now,
      consecutiveFailures: 0,
    };
    db.insert(projectStatus).values(row).onConflictDoUpdate({ target: projectStatus.projectId, set: row }).run();
    return { projectId: project.id, name: project.name, ok: true, status: row.status };
  } catch (err) {
    // Keep last good snapshot; just record the failed attempt.
    const failures = (prev?.consecutiveFailures ?? 0) + 1;
    db.insert(projectStatus)
      .values({
        projectId: project.id,
        status: prev?.status ?? "unknown",
        progress: prev?.progress ?? null,
        stage: prev?.stage ?? null,
        summary: prev?.summary ?? null,
        rawJson: prev?.rawJson ?? null,
        portalUpdatedAt: prev?.portalUpdatedAt ?? null,
        lastCheckedAt: now,
        lastSuccessAt: prev?.lastSuccessAt ?? null,
        consecutiveFailures: failures,
      })
      .onConflictDoUpdate({
        target: projectStatus.projectId,
        set: { lastCheckedAt: now, consecutiveFailures: failures },
      })
      .run();
    return {
      projectId: project.id,
      name: project.name,
      ok: false,
      status: prev?.status ?? "unknown",
      reason: err instanceof Error ? err.message : "fetch failed",
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Poll every project that has a status endpoint, concurrently and independently. */
export async function pollAll(baseUrl?: string): Promise<PollOutcome[]> {
  const rows = db
    .select({ id: projects.id, name: projects.name, statusEndpoint: projects.statusEndpoint, statusToken: projects.statusToken })
    .from(projects)
    .all()
    .filter((p) => p.statusEndpoint);
  const results = await Promise.allSettled(rows.map((p) => pollProject(p, baseUrl)));
  return results.map((r, i) =>
    r.status === "fulfilled" ? r.value : { projectId: rows[i].id, name: rows[i].name, ok: false, status: "unknown", reason: "poll threw" },
  );
}
