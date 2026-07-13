import { statusTone, type Tone } from "@/lib/options";

const toneVars: Record<Tone, { bg: string; fg: string }> = {
  green: { bg: "var(--health-green-soft)", fg: "var(--health-green-text)" },
  amber: { bg: "var(--health-amber-soft)", fg: "var(--health-amber-text)" },
  red: { bg: "var(--health-red-soft)", fg: "var(--health-red-text)" },
  blue: { bg: "var(--health-blue-soft)", fg: "var(--health-blue-text)" },
  neutral: { bg: "var(--health-stale-soft)", fg: "var(--health-stale-text)" },
};

export function StatusBadge({
  value,
  tone,
  size = "md",
}: {
  value: string | null | undefined;
  tone?: Tone;
  size?: "sm" | "md";
}) {
  if (!value) return <span style={{ color: "var(--ink-muted)" }}>—</span>;
  const t = toneVars[tone ?? statusTone(value)];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[6px] font-medium ${
        size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-[12px]"
      }`}
      style={{ background: t.bg, color: t.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.fg }} />
      {value}
    </span>
  );
}
