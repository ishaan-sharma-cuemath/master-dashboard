"use client";

import { setStatusEndpoint } from "@/lib/actions/oversight";
import { Check, Link2, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function StatusEndpointField({
  projectId,
  endpoint,
  hasToken,
}: {
  projectId: string;
  endpoint: string | null;
  hasToken: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(endpoint ?? "");
  const [token, setToken] = useState("");

  const save = () =>
    start(async () => {
      await setStatusEndpoint(projectId, url, token);
      setEditing(false);
      router.refresh();
    });

  return (
    <div className="flex items-center gap-2 text-[13px]">
      <Link2 size={14} strokeWidth={1.8} style={{ color: "var(--ink-muted)" }} />
      {editing ? (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://portal.example.com/api/status"
            className="h-8 w-[280px] rounded-[8px] border px-2.5 text-[13px] outline-none focus:border-[var(--accent)]"
            style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
          />
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="bearer token (optional)"
            className="h-8 w-[150px] rounded-[8px] border px-2.5 text-[13px] outline-none focus:border-[var(--accent)]"
            style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
          />
          <button type="submit" disabled={pending} className="rounded-[7px] p-1.5" style={{ background: "var(--accent-soft)", color: "var(--accent)" }} title="Save">
            <Check size={14} strokeWidth={2.2} />
          </button>
        </form>
      ) : endpoint ? (
        <span className="flex items-center gap-1.5" style={{ color: "var(--ink-secondary)" }}>
          Reports via <span className="font-mono text-[12px]">{endpoint}</span>
          {hasToken && <span className="text-[11px]" style={{ color: "var(--ink-muted)" }}>· authed</span>}
          <button type="button" onClick={() => setEditing(true)} className="align-middle" title="Edit" style={{ color: "var(--ink-muted)" }}>
            <Pencil size={12} strokeWidth={1.8} />
          </button>
        </span>
      ) : (
        <button type="button" onClick={() => setEditing(true)} className="underline underline-offset-2" style={{ color: "var(--accent)" }}>
          Connect status endpoint
        </button>
      )}
    </div>
  );
}
