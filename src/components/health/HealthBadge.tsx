import type { Lifecycle } from "@/lib/db/schema";
import type { DisplayHealth } from "@/lib/derive";
import { HealthGlyph, healthVars, healthWord } from "./HealthGlyph";

/** Glyph + word in a soft pill. Shape + color + word — never color alone. */
export function HealthBadge({
  dh,
  lifecycle,
  size = "md",
}: {
  dh: DisplayHealth;
  lifecycle?: Lifecycle;
  size?: "sm" | "md";
}) {
  const { text, soft } = healthVars(dh);
  const neutral = dh.kind === "neutral" || dh.kind === "completed" || dh.kind === "cancelled";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[6px] font-medium whitespace-nowrap ${
        size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-[12px]"
      }`}
      style={{
        background: neutral ? "transparent" : soft,
        color: neutral ? "var(--ink-muted)" : text,
        border: neutral ? "1px solid var(--line)" : "1px solid transparent",
      }}
    >
      <HealthGlyph dh={dh} size={size === "sm" ? 10 : 12} />
      {healthWord(dh, lifecycle)}
    </span>
  );
}
