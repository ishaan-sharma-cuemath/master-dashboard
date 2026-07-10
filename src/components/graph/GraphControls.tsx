"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { clearGraphPins } from "@/lib/actions/graph";

function ToggleChip({
  label,
  active,
  onClick,
  title,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      title={title}
      onClick={onClick}
      className="rounded-[6px] px-2 py-[3px] font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] transition-colors duration-120"
      style={{
        background: active ? "var(--accent-soft)" : "transparent",
        color: active ? "var(--accent)" : "var(--ink-muted)",
      }}
    >
      {label}
    </button>
  );
}

export function GraphControls({
  showTags,
  onToggleTags,
  spotlightOrphans,
  onToggleOrphans,
}: {
  showTags: boolean;
  onToggleTags: () => void;
  spotlightOrphans: boolean;
  onToggleOrphans: () => void;
}) {
  const [resetting, setResetting] = useState(false);

  async function handleReset() {
    if (resetting) return;
    setResetting(true);
    try {
      await clearGraphPins();
      window.location.reload();
    } catch {
      setResetting(false);
    }
  }

  return (
    <div
      className="absolute right-3 top-3 z-10 flex items-center gap-0.5 rounded-[8px] border p-0.5"
      style={{ borderColor: "var(--line)", background: "var(--surface-raised)" }}
    >
      <ToggleChip label="Tags" active={showTags} onClick={onToggleTags} title="Show or hide tag nodes and links" />
      <ToggleChip
        label="Orphans"
        active={spotlightOrphans}
        onClick={onToggleOrphans}
        title="Spotlight projects with no relations"
      />
      <span aria-hidden className="mx-0.5 h-4 w-px" style={{ background: "var(--line)" }} />
      <button
        type="button"
        onClick={handleReset}
        disabled={resetting}
        title="Clear all pinned positions and re-run the layout"
        className="flex items-center gap-1 rounded-[6px] px-2 py-[3px] font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] transition-colors duration-120 disabled:opacity-50"
        style={{ color: "var(--ink-muted)" }}
      >
        <RotateCcw size={12} strokeWidth={1.75} className={resetting ? "animate-spin" : undefined} />
        Reset layout
      </button>
    </div>
  );
}
