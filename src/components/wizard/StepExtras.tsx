"use client";

import { useState } from "react";
import { HealthGlyph, healthWord } from "@/components/health/HealthGlyph";
import { HEALTHS, type Health } from "@/lib/db/schema";
import { Link2, Plus, X } from "lucide-react";
import { fieldStyle, inputCls, textareaCls, type DraftLink, type WizardData, type WizardDraft } from "./draft";

export function StepExtras({
  draft,
  data,
  onChange,
}: {
  draft: WizardDraft;
  data: WizardData;
  onChange: (patch: Partial<WizardDraft>) => void;
}) {
  const [relatedQuery, setRelatedQuery] = useState("");

  const patchLink = (id: string, patch: Partial<DraftLink>) =>
    onChange({ links: draft.links.map((l) => (l.id === id ? { ...l, ...patch } : l)) });

  const toggleRelated = (id: string) =>
    onChange({
      relatedProjectIds: draft.relatedProjectIds.includes(id)
        ? draft.relatedProjectIds.filter((x) => x !== id)
        : [...draft.relatedProjectIds, id],
    });

  const candidates = data.projects.filter((p) => p.name.toLowerCase().includes(relatedQuery.trim().toLowerCase()));

  return (
    <div className="flex flex-col gap-6">
      {/* ————— External links ————— */}
      <section>
        <div className="microlabel">External links</div>
        <div className="mt-2 flex flex-col gap-2">
          {draft.links.map((l) => (
            <div key={l.id} className="flex items-center gap-2">
              <Link2 size={13} strokeWidth={1.5} className="shrink-0" style={{ color: "var(--ink-muted)" }} />
              <input
                value={l.label}
                onChange={(e) => patchLink(l.id, { label: e.target.value })}
                placeholder="Label"
                className={`${inputCls} h-8 w-[130px] shrink-0`}
                style={fieldStyle}
              />
              <input
                value={l.url}
                onChange={(e) => patchLink(l.id, { url: e.target.value })}
                placeholder="https://…"
                className={`${inputCls} h-8 min-w-0 flex-1 font-mono text-[12px]`}
                style={fieldStyle}
              />
              <button
                type="button"
                onClick={() => onChange({ links: draft.links.filter((x) => x.id !== l.id) })}
                aria-label="Remove link"
                className="shrink-0 rounded-[6px] p-1 transition-colors hover:bg-[var(--health-red-soft)] hover:text-[var(--health-red-text)]"
                style={{ color: "var(--ink-muted)" }}
              >
                <X size={13} strokeWidth={2} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange({ links: [...draft.links, { id: crypto.randomUUID(), label: "", url: "" }] })
            }
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[8px] border border-dashed text-[12.5px] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            style={{ borderColor: "var(--line-strong)", color: "var(--ink-secondary)" }}
          >
            <Plus size={13} strokeWidth={2} /> Add link
          </button>
        </div>
      </section>

      {/* ————— Related projects ————— */}
      <section>
        <div className="microlabel">Related projects</div>
        {data.projects.length === 0 ? (
          <p className="mt-2 text-[12.5px]" style={{ color: "var(--ink-muted)" }}>
            No other projects yet.
          </p>
        ) : (
          <>
            {data.projects.length > 8 && (
              <input
                value={relatedQuery}
                onChange={(e) => setRelatedQuery(e.target.value)}
                placeholder="Filter projects…"
                className={`${inputCls} mt-2 h-8`}
                style={fieldStyle}
              />
            )}
            <div className="mt-2 flex max-h-[168px] flex-wrap content-start gap-1.5 overflow-y-auto pr-1">
              {candidates.map((p) => {
                const active = draft.relatedProjectIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleRelated(p.id)}
                    aria-pressed={active}
                    className="inline-flex items-center rounded-[6px] border px-2 py-0.5 text-[12px] leading-[20px] transition-colors"
                    style={
                      active
                        ? { borderColor: "var(--accent)", background: "var(--accent-soft)", color: "var(--ink)" }
                        : { borderColor: "var(--line)", background: "var(--surface-raised)", color: "var(--ink-secondary)" }
                    }
                  >
                    {p.name}
                  </button>
                );
              })}
              {candidates.length === 0 && (
                <span className="text-[12.5px]" style={{ color: "var(--ink-muted)" }}>
                  No matches.
                </span>
              )}
            </div>
          </>
        )}
      </section>

      {/* ————— Initial health ————— */}
      <section>
        <div className="microlabel">Initial health</div>
        <div role="radiogroup" aria-label="Initial health" className="mt-2 grid grid-cols-3 gap-2">
          {HEALTHS.map((h: Health) => {
            const dh = { kind: "rag" as const, health: h, ring: "solid" as const };
            const active = draft.initialHealth === h;
            return (
              <button
                key={h}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange({ initialHealth: active ? null : h })}
                className="card flex items-center justify-center gap-2 px-3 py-2.5 text-[13px] font-medium"
                style={active ? { borderColor: "var(--accent)", boxShadow: "0 0 0 1px var(--accent)" } : undefined}
              >
                <HealthGlyph dh={dh} size={12} />
                <span style={{ color: active ? "var(--ink)" : "var(--ink-secondary)" }}>{healthWord(dh)}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-[11.5px]" style={{ color: "var(--ink-muted)" }}>
          Optional. Posts a first status update. Click again to clear.
        </p>
      </section>

      {/* ————— First update note ————— */}
      <section>
        <div className="microlabel">First update note</div>
        <textarea
          value={draft.initialNote}
          onChange={(e) => onChange({ initialNote: e.target.value })}
          placeholder="Kicking off, scope agreed with…"
          rows={3}
          className={`${textareaCls} mt-2`}
          style={fieldStyle}
          disabled={!draft.initialHealth}
        />
        {!draft.initialHealth && (
          <p className="mt-1.5 text-[11.5px]" style={{ color: "var(--ink-muted)" }}>
            Pick a health above to include a first update.
          </p>
        )}
      </section>
    </div>
  );
}
