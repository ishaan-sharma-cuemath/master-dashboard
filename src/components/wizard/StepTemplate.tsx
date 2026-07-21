"use client";

import { TEMPLATE_GROUPS, TEMPLATES } from "@/lib/templates";
import { Check, GraduationCap } from "lucide-react";

export function StepTemplate({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-[13px]" style={{ color: "var(--ink-secondary)" }}>
        Pick a starting point. Everything stays editable. Choose the shape that fits: a{" "}
        <span className="font-medium">staged</span> project, a <span className="font-medium">pipeline</span> tracker, or a{" "}
        <span className="font-medium">metric</span>.
      </p>

      {TEMPLATE_GROUPS.map((group) => {
        const items = TEMPLATES.filter((t) => t.group === group);
        if (!items.length) return null;
        return (
          <div key={group}>
            <div className="microlabel mb-2">{group}</div>
            <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(238px, 1fr))" }}>
              {items.map((t) => {
                const active = selected === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => onSelect(t.key)}
                    className="card p-3 text-left transition-shadow"
                    style={active ? { borderColor: "var(--accent)", boxShadow: "0 0 0 1px var(--accent)" } : {}}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[13.5px] font-semibold" style={{ color: "var(--ink)" }}>
                        {t.name}
                      </span>
                      {t.edtech && <GraduationCap size={12} strokeWidth={2} style={{ color: "var(--accent)" }} />}
                      {active && <Check size={13} strokeWidth={2.2} className="ml-auto shrink-0" style={{ color: "var(--accent)" }} />}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug" style={{ color: "var(--ink-muted)" }}>
                      {t.description}
                    </p>
                    <div className="mt-2 line-clamp-2 font-mono text-[11px]" style={{ color: "var(--ink-muted)" }}>
                      {t.shape === "linear" && t.stages?.map((s) => s.name).join(" · ")}
                      {t.shape === "pipeline" && t.outcomes && `→ ${t.outcomes.join(" / ")}`}
                      {t.shape === "metric" && t.metric && `metric · ${t.metric.label}${t.metric.unit ? ` (${t.metric.unit})` : ""}`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
