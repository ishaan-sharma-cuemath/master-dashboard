"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { quickCreateProject } from "@/lib/actions/projects";
import { ArrowUpRight, Zap } from "lucide-react";
import Link from "next/link";

/**
 * Global quick-create. Self-contained: render once inside AppShell.
 * Opens on the "c" key (outside inputs) or `window.dispatchEvent(new CustomEvent("quick-create-open"))`.
 */
export function QuickCreateDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef(false);

  useEffect(() => {
    const onOpenEvent = () => setOpen(true);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "c" || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || e.repeat || e.isComposing) return;
      const t = e.target as HTMLElement | null;
      if (t) {
        const tag = t.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable) return;
      }
      e.preventDefault();
      setOpen(true);
    };

    window.addEventListener("quick-create-open", onOpenEvent);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("quick-create-open", onOpenEvent);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const handleOpenChange = (next: boolean) => {
    if (pendingRef.current) return; // don't dismiss mid-create
    setOpen(next);
    if (!next) {
      setName("");
      setError(null);
    }
  };

  const create = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2 || pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setError(null);
    try {
      const { id } = await quickCreateProject(trimmed);
      pendingRef.current = false;
      setPending(false);
      setOpen(false);
      setName("");
      router.push(`/projects/${id}`);
    } catch (e) {
      pendingRef.current = false;
      setPending(false);
      setError(e instanceof Error ? e.message : "Could not create the project.");
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50 backdrop-blur-[2px]"
          style={{ background: "color-mix(in srgb, var(--canvas) 62%, transparent)" }}
        />
        <Dialog.Content
          className="fixed left-1/2 top-[22vh] z-50 w-[min(460px,calc(100vw-32px))] -translate-x-1/2 rounded-[14px] border p-5 outline-none"
          style={{
            background: "var(--surface-raised)",
            borderColor: "var(--line)",
            boxShadow: "0 16px 48px rgba(0, 0, 0, 0.22)",
          }}
          aria-describedby={undefined}
        >
          <div className="flex items-center gap-2">
            <Zap size={13} strokeWidth={2} style={{ color: "var(--accent)" }} />
            <Dialog.Title asChild>
              <h2 className="microlabel" style={{ color: "var(--ink-secondary)" }}>
                Quick create
              </h2>
            </Dialog.Title>
            <kbd
              className="ml-auto rounded-[4px] border px-1.5 font-mono text-[10px] leading-[18px]"
              style={{ borderColor: "var(--line)", color: "var(--ink-muted)" }}
            >
              C
            </kbd>
          </div>

          <form
            className="mt-3 flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void create();
            }}
          >
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name…"
              aria-label="Project name"
              className="h-9 w-full min-w-0 flex-1 rounded-[8px] border px-3 text-[13px] outline-none transition-colors placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)]"
              style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
            />
            <button
              type="submit"
              disabled={pending || name.trim().length < 2}
              className="inline-flex h-9 shrink-0 items-center rounded-[8px] px-3.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: "var(--accent)" }}
            >
              {pending ? "Creating…" : "Create"}
            </button>
          </form>

          {error && (
            <p className="mt-2 text-[12px]" style={{ color: "var(--health-red-text)" }} role="alert">
              {error}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--line)" }}>
            <span className="text-[11.5px]" style={{ color: "var(--ink-muted)" }}>
              Lands in Unsorted as backlog
            </span>
            <Link
              href="/new"
              onClick={() => handleOpenChange(false)}
              className="inline-flex items-center gap-1 text-[12px] font-medium underline-offset-2 hover:underline"
              style={{ color: "var(--accent)" }}
            >
              Open full setup <ArrowUpRight size={12} strokeWidth={2} />
            </Link>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
