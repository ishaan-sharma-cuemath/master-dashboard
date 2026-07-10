import type { DisplayHealth } from "@/lib/derive";
import type { Lifecycle } from "@/lib/db/schema";

/**
 * The health glyph language — shape + color, never color alone.
 * on_track = teal circle · at_risk = amber triangle · off_track = red square
 * stale = gray dot · aging = dashed decay ring around the shape.
 * Identical geometry everywhere: cards, table, pills, picker, graph canvas.
 */

export function healthWord(dh: DisplayHealth, lifecycle?: Lifecycle): string {
  switch (dh.kind) {
    case "rag":
      return dh.health === "on_track" ? "On track" : dh.health === "at_risk" ? "At risk" : "Off track";
    case "stale":
      return "Awaiting update";
    case "neutral":
      return lifecycle === "planned" ? "Planned" : lifecycle === "on_hold" ? "On hold" : "Backlog";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
  }
}

export function healthVars(dh: DisplayHealth): { fill: string; text: string; soft: string } {
  if (dh.kind === "rag") {
    const key = dh.health === "on_track" ? "green" : dh.health === "at_risk" ? "amber" : "red";
    return {
      fill: `var(--health-${key})`,
      text: `var(--health-${key}-text)`,
      soft: `var(--health-${key}-soft)`,
    };
  }
  if (dh.kind === "completed") {
    return { fill: "var(--health-green)", text: "var(--health-green-text)", soft: "transparent" };
  }
  return { fill: "var(--health-stale)", text: "var(--health-stale-text)", soft: "var(--health-stale-soft)" };
}

export function HealthGlyph({ dh, size = 12 }: { dh: DisplayHealth; size?: number }) {
  const { fill } = healthVars(dh);
  const decay = dh.kind === "rag" && dh.ring === "dashed";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden
      className="shrink-0"
      style={{ overflow: "visible" }}
    >
      {decay && (
        <circle cx="8" cy="8" r="7.4" fill="none" stroke={fill} strokeWidth="1.3" strokeDasharray="2.4 2.2" opacity="0.75" />
      )}
      {dh.kind === "rag" && dh.health === "on_track" && <circle cx="8" cy="8" r="4.6" fill={fill} />}
      {dh.kind === "rag" && dh.health === "at_risk" && (
        <path d="M8 2.6 L13.4 12.4 L2.6 12.4 Z" fill={fill} stroke={fill} strokeWidth="1.6" strokeLinejoin="round" />
      )}
      {dh.kind === "rag" && dh.health === "off_track" && <rect x="3.4" y="3.4" width="9.2" height="9.2" rx="1.8" fill={fill} />}
      {dh.kind === "stale" && <circle cx="8" cy="8" r="4.6" fill={fill} />}
      {dh.kind === "neutral" && <circle cx="8" cy="8" r="4.4" fill="none" stroke="var(--line-strong)" strokeWidth="1.6" />}
      {dh.kind === "completed" && (
        <>
          <circle cx="8" cy="8" r="6.2" fill="none" stroke={fill} strokeWidth="1.4" />
          <path d="M5.2 8.2 L7.2 10.2 L10.9 5.9" fill="none" stroke={fill} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {dh.kind === "cancelled" && (
        <>
          <circle cx="8" cy="8" r="6.2" fill="none" stroke={fill} strokeWidth="1.4" />
          <path d="M4.5 11.5 L11.5 4.5" fill="none" stroke={fill} strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
