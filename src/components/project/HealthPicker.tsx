"use client";

import { HealthGlyph } from "@/components/health/HealthGlyph";
import type { Health } from "@/lib/db/schema";

const OPTIONS: { health: Health; word: string; criteria: string }[] = [
  { health: "on_track", word: "On track", criteria: "On schedule; nothing Akash needs to know" },
  { health: "at_risk", word: "At risk", criteria: "Might slip; team can recover alone" },
  { health: "off_track", word: "Off track", criteria: "Date breached or Akash's decision needed" },
];

const KEY = { on_track: "green", at_risk: "amber", off_track: "red" } as const;

/** Three large radio cards — glyph + word + the written criteria as helper text. */
export function HealthPicker({
  value,
  onChange,
  disabled,
}: {
  value: Health | null;
  onChange: (h: Health) => void;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label="Health" className="grid gap-2 sm:grid-cols-3">
      {OPTIONS.map((o) => {
        const selected = value === o.health;
        const k = KEY[o.health];
        return (
          <button
            key={o.health}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(o.health)}
            className="flex flex-col items-start gap-1 rounded-[8px] border px-3 py-2.5 text-left transition-colors disabled:opacity-60"
            style={{
              borderColor: selected ? `var(--health-${k})` : "var(--line)",
              background: selected ? `var(--health-${k}-soft)` : "var(--surface)",
            }}
          >
            <span
              className="flex items-center gap-2 text-[13px] font-semibold"
              style={{ color: selected ? `var(--health-${k}-text)` : "var(--ink)" }}
            >
              <HealthGlyph dh={{ kind: "rag", health: o.health, ring: "solid" }} size={12} />
              {o.word}
            </span>
            <span className="text-[12px] leading-snug" style={{ color: "var(--ink-muted)" }}>
              {o.criteria}
            </span>
          </button>
        );
      })}
    </div>
  );
}
