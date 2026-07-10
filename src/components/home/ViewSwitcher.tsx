"use client";

import { LayoutGrid, Waypoints } from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect } from "react";

const VIEWS = ["list", "graph"] as const;
export type ViewKind = (typeof VIEWS)[number];

const STORAGE_KEY = "akash-dashboard:view";

const SEGMENTS: { value: ViewKind; label: string; icon: typeof LayoutGrid }[] = [
  { value: "list", label: "List", icon: LayoutGrid },
  { value: "graph", label: "Graph", icon: Waypoints },
];

/**
 * List | Graph toggle bound to ?view= (shallow:false → server re-renders).
 * "List" = the project tiles · "Graph" = the Obsidian-style graph.
 * Remembers the last choice and restores it when the URL has no ?view.
 */
export function ViewSwitcher() {
  const [view, setView] = useQueryState("view", parseAsStringLiteral(VIEWS).withOptions({ shallow: false }));
  const current: ViewKind = view ?? "list";

  useEffect(() => {
    if (view !== null) return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "graph") void setView("graph");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (v: ViewKind) => {
    window.localStorage.setItem(STORAGE_KEY, v);
    void setView(v === "list" ? null : v); // null clears the param for the default view
  };

  return (
    <div
      role="group"
      aria-label="View"
      className="inline-flex h-[34px] shrink-0 items-center gap-0.5 rounded-[9px] border p-[3px]"
      style={{ borderColor: "var(--line)", background: "var(--surface)", boxShadow: "var(--shadow)" }}
    >
      {SEGMENTS.map(({ value, label, icon: Icon }) => {
        const active = current === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => choose(value)}
            className="inline-flex h-full items-center gap-1.5 rounded-[6px] px-3 text-[12.5px] font-medium transition-colors"
            style={
              active
                ? { background: "var(--btn)", color: "var(--btn-ink)" }
                : { color: "var(--ink-secondary)" }
            }
          >
            <Icon size={14} strokeWidth={1.9} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
