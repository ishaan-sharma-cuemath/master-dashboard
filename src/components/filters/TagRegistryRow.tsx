"use client";

import { TagChip } from "@/components/ui/TagChip";
import { deleteTag, renameTag } from "@/lib/actions/org";
import type { TagRow } from "@/lib/db/schema";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";

/** Shared row grid — keep in sync with the header row in src/app/tags/page.tsx. */
export const TAG_ROW_GRID = "grid grid-cols-[200px_140px_minmax(240px,1fr)_70px_88px] items-center gap-3 px-4";

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  submit,
  children,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  submit?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type={submit ? "submit" : "button"}
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] border transition-colors hover:border-[var(--line-strong)] disabled:opacity-40"
      style={{
        borderColor: "var(--line)",
        color: danger ? "var(--health-red-text)" : "var(--ink-secondary)",
        background: "var(--surface-raised)",
      }}
    >
      {children}
    </button>
  );
}

export function TagRegistryRow({
  tag,
  groupName,
  usage,
}: {
  tag: TagRow;
  groupName: string | null;
  usage: number;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(tag.name);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const startEdit = () => {
    setName(tag.name);
    setError(null);
    setEditing(true);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next = name.trim();
    if (next === tag.name) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      const res = await renameTag(tag.id, next);
      if ("error" in res && res.error) {
        setError(res.error);
      } else {
        setError(null);
        setEditing(false);
      }
    });
  };

  const remove = () => {
    const suffix =
      usage === 0 ? "It isn't used by any project." : `It will be removed from ${usage} project${usage === 1 ? "" : "s"}.`;
    if (!confirm(`Delete tag “${tag.name}”? ${suffix}`)) return;
    startTransition(async () => {
      const res = await deleteTag(tag.id);
      if ("error" in res && res.error) setError(res.error);
    });
  };

  return (
    <div className={`${TAG_ROW_GRID} border-b py-2.5 last:border-b-0`} style={{ borderColor: "var(--line)" }}>
      {/* Name */}
      <div className="min-w-0">
        {editing ? (
          <form onSubmit={submit} className="flex items-center gap-1.5">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setEditing(false);
              }}
              disabled={pending}
              aria-label="Tag name"
              className="h-7 w-full min-w-0 rounded-[6px] border px-2 font-mono text-[11.5px] outline-none transition-colors focus:border-[var(--accent)]"
              style={{ borderColor: "var(--line)", background: "var(--surface-raised)", color: "var(--ink)" }}
            />
            <IconButton label="Save name" submit disabled={pending}>
              <Check size={13} strokeWidth={2} />
            </IconButton>
            <IconButton label="Cancel rename" onClick={() => setEditing(false)} disabled={pending}>
              <X size={13} strokeWidth={2} />
            </IconButton>
          </form>
        ) : (
          <TagChip tag={tag} />
        )}
      </div>

      {/* Group */}
      <div className="truncate font-mono text-[11px]" style={{ color: "var(--ink-muted)" }}>
        {groupName ?? "—"}
      </div>

      {/* Definition (+ inline error) */}
      <div className="min-w-0 truncate text-[13px]" style={{ color: "var(--ink-secondary)" }}>
        {error ? (
          <span className="text-[12px]" style={{ color: "var(--health-red-text)" }}>
            {error}
          </span>
        ) : tag.definition ? (
          tag.definition
        ) : (
          <span style={{ color: "var(--ink-muted)" }}>—</span>
        )}
      </div>

      {/* Usage */}
      <div className="text-right font-mono text-[11px] tabular-nums" style={{ color: usage === 0 ? "var(--ink-muted)" : "var(--ink-secondary)" }}>
        {usage}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1.5">
        {!editing && (
          <IconButton label={`Rename ${tag.name}`} onClick={startEdit} disabled={pending}>
            <Pencil size={12} strokeWidth={1.75} />
          </IconButton>
        )}
        <IconButton label={`Delete ${tag.name}`} onClick={remove} disabled={pending} danger>
          <Trash2 size={12} strokeWidth={1.75} />
        </IconButton>
      </div>
    </div>
  );
}
