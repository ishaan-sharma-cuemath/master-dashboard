"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createProject, type CreateProjectInput } from "@/lib/actions/projects";
import { getTemplate } from "@/lib/templates";
import { addDays, format } from "date-fns";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { emptyDraft, type WizardData, type WizardDraft } from "./draft";
import { StepBasics } from "./StepBasics";
import { StepExtras } from "./StepExtras";
import { StepStages } from "./StepStages";
import { StepTemplate } from "./StepTemplate";

const STEPS = ["Template", "Basics", "Stages", "Extras"] as const;
const DRAFT_KEY = "wizard-draft";

/** Drop draft references to entities that no longer exist. */
function sanitizeDraft(raw: Partial<WizardDraft>, data: WizardData): WizardDraft {
  const base = { ...emptyDraft(data.defaults), ...raw };
  const peopleIds = new Set(data.people.map((p) => p.id));
  const tagIds = new Set(data.tags.map((t) => t.id));
  const projectIds = new Set(data.projects.map((p) => p.id));
  if (!data.folders.some((f) => f.id === base.folderId)) base.folderId = data.defaults.folderId;
  if (!peopleIds.has(base.leadId)) base.leadId = data.defaults.leadId;
  base.tagIds = (base.tagIds ?? []).filter((id) => tagIds.has(id));
  base.relatedProjectIds = (base.relatedProjectIds ?? []).filter((id) => projectIds.has(id));
  base.stages = (base.stages ?? []).map((s) => ({ ...s, ownerId: peopleIds.has(s.ownerId) ? s.ownerId : base.leadId }));
  base.links = base.links ?? [];
  return base;
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function WizardShell({ data }: { data: WizardData }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<WizardDraft>(() => emptyDraft(data.defaults));
  const [hydrated, setHydrated] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const creatingRef = useRef(false);

  // Restore draft on mount, autosave on every change, clear on create.
  // localStorage is only readable post-hydration (reading it during render would
  // mismatch the server HTML), so this one-time restore has to live in an effect.
  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { step?: number; draft?: Partial<WizardDraft> };
        if (saved.draft) setDraft(sanitizeDraft(saved.draft, data));
        if (typeof saved.step === "number") setStep(Math.min(Math.max(saved.step, 0), STEPS.length - 1));
      }
    } catch {
      /* corrupt draft — start fresh */
    }
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  useEffect(() => {
    if (!hydrated || creatingRef.current) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, draft }));
    } catch {
      /* storage full/unavailable — draft just won't persist */
    }
  }, [draft, step, hydrated]);

  const patch = useCallback((p: Partial<WizardDraft>) => setDraft((d) => ({ ...d, ...p })), []);

  const selectTemplate = (key: string) => {
    const template = getTemplate(key);
    if (!template) return;
    const today = new Date();
    setDraft((d) => ({
      ...d,
      templateKey: key,
      stages: template.stages.map((s) => ({
        id: crypto.randomUUID(),
        name: s.name,
        ownerId: d.leadId,
        targetDate: format(addDays(today, s.offsetDays), "yyyy-MM-dd"),
      })),
    }));
  };

  const nameValid = draft.name.trim().length >= 2;
  const continueBlocked = step === 1 && !nameValid;

  const submit = async (includeExtras: boolean) => {
    if (pending || !nameValid) return;
    setPending(true);
    setError(null);
    const input: CreateProjectInput = {
      name: draft.name.trim(),
      description: draft.description,
      folderId: draft.folderId,
      leadId: draft.leadId,
      startDate: draft.startDate || null,
      targetDate: draft.targetDate || null,
      tagIds: draft.tagIds,
      stages: draft.stages
        .filter((s) => s.name.trim().length > 0)
        .map((s) => ({ name: s.name.trim(), ownerId: s.ownerId, targetDate: s.targetDate || null })),
      externalLinks: includeExtras
        ? draft.links
            .filter((l) => l.url.trim().length > 0)
            .map((l) => ({ label: l.label.trim() || "Link", url: normalizeUrl(l.url) }))
        : [],
      relatedProjectIds: includeExtras ? draft.relatedProjectIds : [],
      initialHealth: includeExtras ? draft.initialHealth : null,
      initialNote: includeExtras ? draft.initialNote : "",
    };
    try {
      const { id } = await createProject(input);
      creatingRef.current = true;
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      router.push(`/projects/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong — please try again.");
      setPending(false);
    }
  };

  const primaryBtn =
    "inline-flex h-9 items-center gap-1.5 rounded-[8px] px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40";
  const ghostBtn =
    "inline-flex h-9 items-center gap-1.5 rounded-[8px] border px-3 text-[13px] transition-colors hover:border-[var(--line-strong)] disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="rise-in">
      {/* ————— Step indicator ————— */}
      <nav aria-label="Wizard steps" className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {STEPS.map((label, i) => (
          <span key={label} className="flex items-center gap-2">
            {i > 0 && (
              <span aria-hidden className="font-mono text-[11px]" style={{ color: "var(--ink-muted)" }}>
                ·
              </span>
            )}
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              aria-current={i === step ? "step" : undefined}
              className="microlabel transition-colors disabled:cursor-default"
              style={{
                color: i === step ? "var(--accent)" : i < step ? "var(--ink-secondary)" : "var(--ink-muted)",
                cursor: i < step ? "pointer" : undefined,
              }}
            >
              {i} {label}
            </button>
          </span>
        ))}
        <span className="microlabel ml-auto" style={{ color: "var(--ink-muted)" }}>
          {step + 1}/{STEPS.length}
        </span>
      </nav>

      {/* ————— Active step ————— */}
      <div className="mt-6 min-h-[280px]">
        {step === 0 && <StepTemplate selected={draft.templateKey} onSelect={selectTemplate} />}
        {step === 1 && <StepBasics draft={draft} data={data} onChange={patch} />}
        {step === 2 && (
          <StepStages
            stages={draft.stages}
            people={data.people}
            defaultOwnerId={draft.leadId}
            onChange={(stages) => patch({ stages })}
          />
        )}
        {step === 3 && <StepExtras draft={draft} data={data} onChange={patch} />}
      </div>

      {error && (
        <p
          className="mt-4 rounded-[8px] border px-3 py-2 text-[12.5px]"
          style={{
            borderColor: "var(--health-red)",
            background: "var(--health-red-soft)",
            color: "var(--health-red-text)",
          }}
          role="alert"
        >
          {error}
        </p>
      )}

      {/* ————— Footer nav ————— */}
      <div className="mt-6 flex items-center gap-2 border-t pt-4" style={{ borderColor: "var(--line)" }}>
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            disabled={pending}
            className={ghostBtn}
            style={{ borderColor: "var(--line)", color: "var(--ink-secondary)", background: "var(--surface)" }}
          >
            <ArrowLeft size={13} strokeWidth={2} /> Back
          </button>
        )}
        {step === 1 && !nameValid && (
          <span className="text-[12px]" style={{ color: "var(--ink-muted)" }}>
            Name needs at least 2 characters
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={continueBlocked}
              className={primaryBtn}
              style={{ background: "var(--accent)" }}
            >
              Continue <ArrowRight size={13} strokeWidth={2} />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => submit(false)}
                disabled={pending || !nameValid}
                className={ghostBtn}
                style={{ borderColor: "var(--line)", color: "var(--ink-secondary)", background: "var(--surface)" }}
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={() => submit(true)}
                disabled={pending || !nameValid}
                className={primaryBtn}
                style={{ background: "var(--accent)" }}
              >
                {pending ? "Creating…" : "Create project"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
