"use client";

import type { TagRow } from "@/lib/db/schema";
import { fieldStyle, inputCls, selectCls, textareaCls, type WizardData, type WizardDraft } from "./draft";

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="microlabel flex items-baseline gap-2">
        {label}
        {hint && (
          <span className="normal-case tracking-normal" style={{ color: "var(--ink-muted)" }}>
            {hint}
          </span>
        )}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function TagToggle({ tag, active, onToggle }: { tag: TagRow; active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      title={tag.definition ?? tag.name}
      className="inline-flex items-center rounded-[6px] border px-2 py-0.5 font-mono text-[11px] leading-[18px] transition-colors"
      style={
        active
          ? { borderColor: "var(--accent)", background: "var(--accent-soft)", color: "var(--ink)" }
          : { borderColor: "var(--line)", background: "var(--surface-raised)", color: "var(--ink-secondary)" }
      }
    >
      {tag.name}
    </button>
  );
}

export function StepBasics({
  draft,
  data,
  onChange,
}: {
  draft: WizardDraft;
  data: WizardData;
  onChange: (patch: Partial<WizardDraft>) => void;
}) {
  const toggleTag = (id: string) =>
    onChange({
      tagIds: draft.tagIds.includes(id) ? draft.tagIds.filter((t) => t !== id) : [...draft.tagIds, id],
    });

  const tagSections: { label: string; tags: TagRow[] }[] = [
    ...data.tagGroups.map((g) => ({ label: g.name, tags: data.tags.filter((t) => t.tagGroupId === g.id) })),
    { label: "Other", tags: data.tags.filter((t) => t.tagGroupId === null) },
  ].filter((s) => s.tags.length > 0);

  return (
    <div className="flex flex-col gap-5">
      <Field label="Name" hint="required">
        <input
          autoFocus
          value={draft.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g. Fractions revamp"
          className={inputCls}
          style={fieldStyle}
        />
      </Field>

      <Field label="Readme" hint="markdown">
        <textarea
          value={draft.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="What is this project? Goals, context, links…"
          rows={4}
          className={textareaCls}
          style={fieldStyle}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Folder">
          <select
            value={draft.folderId}
            onChange={(e) => onChange({ folderId: e.target.value })}
            className={selectCls}
            style={fieldStyle}
          >
            {data.folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Lead">
          <select
            value={draft.leadId}
            onChange={(e) => onChange({ leadId: e.target.value })}
            className={selectCls}
            style={fieldStyle}
          >
            {data.people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Start date">
          <input
            type="date"
            value={draft.startDate}
            onChange={(e) => onChange({ startDate: e.target.value })}
            className={`${inputCls} font-mono text-[12px]`}
            style={fieldStyle}
          />
        </Field>
        <Field label="Target date">
          <input
            type="date"
            value={draft.targetDate}
            onChange={(e) => onChange({ targetDate: e.target.value })}
            className={`${inputCls} font-mono text-[12px]`}
            style={fieldStyle}
          />
        </Field>
      </div>

      {tagSections.length > 0 && (
        <div className="flex flex-col gap-3">
          {tagSections.map((s) => (
            <div key={s.label}>
              <div className="microlabel">{s.label}</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {s.tags.map((t) => (
                  <TagToggle key={t.id} tag={t} active={draft.tagIds.includes(t.id)} onToggle={() => toggleTag(t.id)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
