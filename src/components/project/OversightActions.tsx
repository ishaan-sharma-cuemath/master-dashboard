"use client";

import { clearStatusRequest, requestStatus, setOwner, toggleFlag } from "@/lib/actions/oversight";
import { relAge } from "@/lib/format";
import { Bell, BellRing, Check, Flag, Mail, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  projectId: string;
  flagged: boolean;
  flagNote: string | null;
  daysSinceRequest: number | null;
  ownerName: string | null;
  ownerEmail: string | null;
};

export function OversightActions({ projectId, flagged, flagNote, daysSinceRequest, ownerName, ownerEmail }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [showFlagNote, setShowFlagNote] = useState(false);
  const [note, setNote] = useState("");
  const [editingOwner, setEditingOwner] = useState(false);
  const [name, setName] = useState(ownerName ?? "");
  const [email, setEmail] = useState(ownerEmail ?? "");
  const [askResult, setAskResult] = useState<string | null>(null);

  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      await fn();
      router.refresh();
    });

  const ask = () =>
    start(async () => {
      const res = await requestStatus(projectId);
      setAskResult(res.emailed ? `Emailed ${ownerEmail}.` : (res.reason ?? "Requested."));
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-3">
      {/* Owner contact */}
      <div className="flex items-center gap-2 text-[13px]">
        <Mail size={14} strokeWidth={1.8} style={{ color: "var(--ink-muted)" }} />
        {editingOwner ? (
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => setOwner(projectId, name, email));
              setEditingOwner(false);
            }}
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Owner name"
              className="h-8 w-[150px] rounded-[8px] border px-2.5 text-[13px] outline-none focus:border-[var(--accent)]"
              style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@cuemath.com"
              className="h-8 w-[200px] rounded-[8px] border px-2.5 text-[13px] outline-none focus:border-[var(--accent)]"
              style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
            />
            <button type="submit" disabled={pending} className="rounded-[7px] p-1.5" style={{ background: "var(--accent-soft)", color: "var(--accent)" }} title="Save">
              <Check size={14} strokeWidth={2.2} />
            </button>
          </form>
        ) : ownerEmail ? (
          <span style={{ color: "var(--ink-secondary)" }}>
            {ownerName ? `${ownerName} · ` : ""}
            {ownerEmail}
            <button type="button" onClick={() => setEditingOwner(true)} className="ml-1.5 align-middle" title="Edit owner" style={{ color: "var(--ink-muted)" }}>
              <Pencil size={12} strokeWidth={1.8} />
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => setEditingOwner(true)} className="underline underline-offset-2" style={{ color: "var(--accent)" }}>
            Set owner email
          </button>
        )}
      </div>

      {/* Flag banner */}
      {flagged && (
        <div className="flex items-start gap-2.5 rounded-[10px] px-3.5 py-2.5" style={{ background: "var(--health-red-soft)", color: "var(--health-red-text)" }}>
          <Flag size={15} strokeWidth={2} className="mt-0.5 shrink-0" fill="currentColor" />
          <div className="min-w-0 flex-1 text-[13px]">
            <span className="font-semibold">Flagged for attention.</span>
            {flagNote && <span> {flagNote}</span>}
          </div>
          <button type="button" disabled={pending} onClick={() => run(() => toggleFlag(projectId, false))} className="shrink-0 rounded-[6px] p-0.5 transition-opacity hover:opacity-70" title="Clear flag">
            <X size={15} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* Status-request banner */}
      {daysSinceRequest !== null && (
        <div className="flex items-center gap-2.5 rounded-[10px] px-3.5 py-2.5 text-[13px]" style={{ background: "var(--health-amber-soft)", color: "var(--health-amber-text)" }}>
          <BellRing size={15} strokeWidth={2} className="shrink-0" />
          <span className="flex-1">Status requested {relAge(daysSinceRequest)} — awaiting the owner&apos;s update.</span>
          <button type="button" disabled={pending} onClick={() => run(() => clearStatusRequest(projectId))} className="shrink-0 rounded-[6px] p-0.5 transition-opacity hover:opacity-70" title="Clear request">
            <X size={15} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* Result note after asking */}
      {askResult && (
        <p className="text-[12.5px]" style={{ color: "var(--ink-muted)" }}>
          {askResult}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2.5">
        {!flagged &&
          (showFlagNote ? (
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                run(() => toggleFlag(projectId, true, note));
                setShowFlagNote(false);
                setNote("");
              }}
            >
              <input
                autoFocus
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What needs attention? (optional)"
                className="h-[34px] w-[260px] rounded-[9px] border px-3 text-[13px] outline-none focus:border-[var(--accent)]"
                style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
              />
              <button type="submit" disabled={pending} className="h-[34px] rounded-[9px] px-3.5 text-[13px] font-semibold text-white" style={{ background: "var(--health-red)" }}>
                Flag
              </button>
              <button type="button" onClick={() => setShowFlagNote(false)} className="text-[12.5px]" style={{ color: "var(--ink-muted)" }}>
                Cancel
              </button>
            </form>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => setShowFlagNote(true)}
              className="inline-flex h-[34px] items-center gap-2 rounded-[9px] border px-3.5 text-[13px] font-medium transition-colors hover:border-[var(--line-strong)]"
              style={{ borderColor: "var(--line)", color: "var(--ink)", background: "var(--surface)" }}
            >
              <Flag size={14} strokeWidth={1.9} /> Flag project
            </button>
          ))}

        {daysSinceRequest === null && (
          <button
            type="button"
            disabled={pending}
            onClick={ask}
            className="inline-flex h-[34px] items-center gap-2 rounded-[9px] border px-3.5 text-[13px] font-medium transition-colors hover:border-[var(--line-strong)]"
            style={{ borderColor: "var(--line)", color: "var(--ink)", background: "var(--surface)" }}
          >
            <Bell size={14} strokeWidth={1.9} /> Ask for status
          </button>
        )}
      </div>
    </div>
  );
}
