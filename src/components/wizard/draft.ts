import type { FolderRow, Health, PersonRow, TagGroupRow, TagRow } from "@/lib/db/schema";

/* ————— wizard draft model (persisted to localStorage) ————— */

export type DraftStage = { id: string; name: string; ownerId: string; targetDate: string };
export type DraftLink = { id: string; label: string; url: string };

export type WizardDraft = {
  templateKey: string | null;
  name: string;
  description: string;
  folderId: string;
  tagIds: string[];
  leadId: string;
  startDate: string;
  targetDate: string;
  stages: DraftStage[];
  links: DraftLink[];
  relatedProjectIds: string[];
  initialHealth: Health | null;
  initialNote: string;
};

export function emptyDraft(defaults: { leadId: string; folderId: string }): WizardDraft {
  return {
    templateKey: null,
    name: "",
    description: "",
    folderId: defaults.folderId,
    tagIds: [],
    leadId: defaults.leadId,
    startDate: "",
    targetDate: "",
    stages: [],
    links: [],
    relatedProjectIds: [],
    initialHealth: null,
    initialNote: "",
  };
}

/* ————— data handed down from the /new server component ————— */

export type WizardData = {
  folders: FolderRow[];
  people: PersonRow[];
  tags: TagRow[];
  tagGroups: TagGroupRow[];
  projects: { id: string; name: string }[];
  defaults: { leadId: string; folderId: string };
};

/* ————— shared form styling (matches the AppShell search input) ————— */

export const inputCls =
  "h-9 w-full rounded-[8px] border px-3 text-[13px] outline-none transition-colors placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)]";

export const textareaCls =
  "w-full rounded-[8px] border px-3 py-2 text-[13px] leading-relaxed outline-none transition-colors placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)]";

export const selectCls =
  "h-9 w-full appearance-none rounded-[8px] border px-3 pr-8 text-[13px] outline-none transition-colors focus:border-[var(--accent)]";

export const fieldStyle: React.CSSProperties = {
  borderColor: "var(--line)",
  background: "var(--surface)",
  color: "var(--ink)",
};
