import type { Lifecycle } from "@/lib/db/schema";
import type { DisplayHealth } from "@/lib/derive";
import { healthWord } from "./HealthGlyph";

/** The simple colored circle: red / yellow / green — gray when quiet or stale. */
export function StatusDot({
  dh,
  lifecycle,
  size = 9,
  note,
  withRing,
}: {
  dh: DisplayHealth;
  lifecycle?: Lifecycle;
  size?: number;
  note?: string;
  /** soft halo ring — used to mark a stale/quiet project */
  withRing?: boolean;
}) {
  const color =
    dh.kind === "rag"
      ? dh.health === "on_track"
        ? "var(--health-green)"
        : dh.health === "at_risk"
          ? "var(--health-amber)"
          : "var(--health-red)"
      : dh.kind === "completed"
        ? "var(--health-green)"
        : "var(--health-stale)";

  return (
    <span
      title={note ? `${healthWord(dh, lifecycle)}: ${note}` : healthWord(dh, lifecycle)}
      className="inline-block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: color,
        boxShadow: withRing ? "0 0 0 3px var(--health-stale-soft)" : undefined,
        opacity: dh.kind === "completed" || dh.kind === "cancelled" || dh.kind === "neutral" ? 0.5 : 1,
      }}
    />
  );
}
