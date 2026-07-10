"use client";

import type { FolderRow, PersonRow, TagRow } from "@/lib/db/schema";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown, X } from "lucide-react";
import { parseAsString, useQueryStates } from "nuqs";
import type { ReactNode } from "react";

/* Param shape mirrors src/lib/queries/filters.ts exactly. */
const FILTER_PARSERS = {
  health: parseAsString,
  owner: parseAsString,
  tag: parseAsString,
  folder: parseAsString,
  stale: parseAsString,
  attention: parseAsString,
  lifecycle: parseAsString,
  q: parseAsString,
};

const CLEARED = {
  health: null,
  owner: null,
  tag: null,
  folder: null,
  stale: null,
  attention: null,
  lifecycle: null,
  q: null,
};

const HEALTH_OPTIONS = [
  { value: "green", label: "On track", swatch: "var(--health-green)" },
  { value: "amber", label: "At risk", swatch: "var(--health-amber)" },
  { value: "red", label: "Off track", swatch: "var(--health-red)" },
  { value: "alert", label: "Any alert (amber + red)", swatch: "var(--health-red)" },
];

const LIFECYCLE_OPTIONS = [
  { value: "backlog", label: "Backlog" },
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In progress" },
  { value: "on_hold", label: "On hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const menuContentClass =
  "z-50 max-h-[320px] min-w-[190px] overflow-y-auto rounded-[10px] border p-1 shadow-[0_12px_32px_rgba(0,0,0,0.14)]";
const menuContentStyle = { background: "var(--surface-raised)", borderColor: "var(--line)" } as const;
const menuItemClass =
  "flex cursor-pointer select-none items-center gap-2 rounded-[6px] px-2 py-1.5 text-[13px] outline-none data-[highlighted]:bg-[var(--accent-soft)]";

function FacetTrigger({ label, active, children }: { label: string; active: boolean; children: ReactNode }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border px-2.5 text-[13px] transition-colors outline-none hover:border-[var(--line-strong)]"
        style={{
          borderColor: active ? "var(--accent)" : "var(--line)",
          color: active ? "var(--accent)" : "var(--ink-secondary)",
          background: "var(--surface)",
        }}
      >
        {label}
        <ChevronDown size={12} strokeWidth={2} style={{ color: "var(--ink-muted)" }} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content sideOffset={6} align="start" className={menuContentClass} style={menuContentStyle}>
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function FacetOption({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <DropdownMenu.Item
      className={menuItemClass}
      style={{ color: "var(--ink)" }}
      onSelect={onSelect}
    >
      {children}
      {selected && <Check size={13} strokeWidth={2} className="ml-auto" style={{ color: "var(--accent)" }} />}
    </DropdownMenu.Item>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span
      className="inline-flex h-7 items-center gap-1 rounded-[6px] border pl-2 pr-1 text-[12px] font-medium"
      style={{ borderColor: "var(--accent)", color: "var(--accent)", background: "var(--accent-soft)" }}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter: ${label}`}
        className="inline-flex h-4 w-4 items-center justify-center rounded-[4px] transition-opacity hover:opacity-70"
      >
        <X size={12} strokeWidth={2} />
      </button>
    </span>
  );
}

/**
 * Facet dropdowns + removable chips, all state in the URL (nuqs, shallow: false
 * so the server page re-filters). Params match src/lib/queries/filters.ts.
 */
export function FilterBar({
  folders,
  people,
  tags,
}: {
  folders: FolderRow[];
  people: PersonRow[];
  tags: TagRow[];
}) {
  const [f, setF] = useQueryStates(FILTER_PARSERS, { shallow: false });

  const toggle = (key: keyof typeof FILTER_PARSERS, value: string) => {
    void setF({ [key]: f[key] === value ? null : value });
  };

  const chips: { key: keyof typeof FILTER_PARSERS; label: string }[] = [];
  if (f.q) chips.push({ key: "q", label: `“${f.q}”` });
  if (f.health) {
    const h = HEALTH_OPTIONS.find((o) => o.value === f.health);
    chips.push({ key: "health", label: `Health: ${h?.label ?? f.health}` });
  }
  if (f.owner) {
    const p = people.find((x) => x.id === f.owner);
    chips.push({ key: "owner", label: `Owner: ${p?.name ?? "Unknown"}` });
  }
  if (f.tag) {
    const t = tags.find((x) => x.id === f.tag);
    chips.push({ key: "tag", label: `Tag: ${t?.name ?? "Unknown"}` });
  }
  if (f.folder) {
    const fo = folders.find((x) => x.id === f.folder);
    chips.push({ key: "folder", label: `Folder: ${fo?.name ?? "Unknown"}` });
  }
  if (f.stale) chips.push({ key: "stale", label: "Stale only" });
  if (f.attention) chips.push({ key: "attention", label: "Needs attention" });
  if (f.lifecycle) {
    const l = LIFECYCLE_OPTIONS.find((o) => o.value === f.lifecycle);
    chips.push({ key: "lifecycle", label: `Lifecycle: ${l?.label ?? f.lifecycle}` });
  }

  const moreActive = Boolean(f.stale || f.attention || f.lifecycle);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FacetTrigger label="Health" active={Boolean(f.health)}>
        {HEALTH_OPTIONS.map((o) => (
          <FacetOption key={o.value} selected={f.health === o.value} onSelect={() => toggle("health", o.value)}>
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: o.swatch }} />
            {o.label}
          </FacetOption>
        ))}
      </FacetTrigger>

      <FacetTrigger label="Owner" active={Boolean(f.owner)}>
        {people.map((p) => (
          <FacetOption key={p.id} selected={f.owner === p.id} onSelect={() => toggle("owner", p.id)}>
            <span
              className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full font-mono text-[8px] font-medium text-white"
              style={{ background: p.avatarColor }}
            >
              {p.name
                .split(/\s+/)
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
            {p.name}
          </FacetOption>
        ))}
      </FacetTrigger>

      <FacetTrigger label="Tag" active={Boolean(f.tag)}>
        {tags.map((t) => (
          <FacetOption key={t.id} selected={f.tag === t.id} onSelect={() => toggle("tag", t.id)}>
            <span className="font-mono text-[11px]">{t.name}</span>
          </FacetOption>
        ))}
      </FacetTrigger>

      <FacetTrigger label="Folder" active={Boolean(f.folder)}>
        {folders.map((fo) => (
          <FacetOption key={fo.id} selected={f.folder === fo.id} onSelect={() => toggle("folder", fo.id)}>
            <span className="h-2 w-2 shrink-0 rounded-[3px]" style={{ background: fo.color ?? "var(--line-strong)" }} />
            {fo.name}
          </FacetOption>
        ))}
      </FacetTrigger>

      <FacetTrigger label="More" active={moreActive}>
        <FacetOption selected={Boolean(f.stale)} onSelect={() => toggle("stale", "1")}>
          Stale only
        </FacetOption>
        <FacetOption selected={Boolean(f.attention)} onSelect={() => toggle("attention", "1")}>
          Needs attention
        </FacetOption>
        <DropdownMenu.Separator className="my-1 h-px" style={{ background: "var(--line)" }} />
        <DropdownMenu.Label className="microlabel px-2 pb-1 pt-1.5">Lifecycle</DropdownMenu.Label>
        {LIFECYCLE_OPTIONS.map((o) => (
          <FacetOption key={o.value} selected={f.lifecycle === o.value} onSelect={() => toggle("lifecycle", o.value)}>
            {o.label}
          </FacetOption>
        ))}
      </FacetTrigger>

      {chips.length > 0 && (
        <>
          <span aria-hidden className="mx-1 h-4 w-px" style={{ background: "var(--line)" }} />
          {chips.map((c) => (
            <Chip key={c.key} label={c.label} onRemove={() => void setF({ [c.key]: null })} />
          ))}
          <button
            type="button"
            onClick={() => void setF(CLEARED)}
            className="text-[12px] underline-offset-2 transition-colors hover:underline"
            style={{ color: "var(--ink-muted)" }}
          >
            Clear all
          </button>
        </>
      )}
    </div>
  );
}
