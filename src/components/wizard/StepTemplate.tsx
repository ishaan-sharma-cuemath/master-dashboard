"use client";

import { TEMPLATES } from "@/lib/templates";
import { Check } from "lucide-react";

export function StepTemplate({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-[13px]" style={{ color: "var(--ink-secondary)" }}>
        Start from a stage scaffold — every stage stays editable in the next steps.
      </p>
      {TEMPLATES.map((t, i) => {
        const active = selected === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onSelect(t.key)}
            className="card rise-in p-4 text-left"
            style={{
              animationDelay: `${i * 45}ms`,
              ...(active ? { borderColor: "var(--accent)", boxShadow: "0 0 0 1px var(--accent)" } : {}),
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                {t.name}
              </span>
              {active && <Check size={14} strokeWidth={2} style={{ color: "var(--accent)" }} />}
            </div>
            <p className="mt-1 text-[12.5px]" style={{ color: "var(--ink-secondary)" }}>
              {t.description}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
              {t.stages.map((s, si) => (
                <span key={s.name} className="flex items-center gap-1.5 font-mono text-[11px]" style={{ color: "var(--ink-muted)" }}>
                  {si > 0 && <span aria-hidden>→</span>}
                  <span
                    className="rounded-[6px] border px-1.5 py-px"
                    style={{ borderColor: "var(--line)", background: "var(--surface-raised)", color: "var(--ink-secondary)" }}
                  >
                    {s.name} <span style={{ color: "var(--ink-muted)" }}>+{s.offsetDays}d</span>
                  </span>
                </span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}
