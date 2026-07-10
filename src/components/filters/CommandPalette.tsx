"use client";

import { HealthGlyph } from "@/components/health/HealthGlyph";
import type { SearchItem } from "@/lib/queries/search";
import { Command } from "cmdk";
import { Folder, Home, Plus, SunMoon, Tag, User, Zap } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

/** Anything can open the palette by dispatching this event on window. */
export const PALETTE_OPEN_EVENT = "palette-open";
export function openPalette() {
  window.dispatchEvent(new Event(PALETTE_OPEN_EVENT));
}

const itemClass =
  "flex cursor-pointer select-none items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[13px] text-[var(--ink)] data-[selected=true]:bg-[var(--accent-soft)]";

function Sublabel({ children }: { children: ReactNode }) {
  return (
    <span className="ml-auto truncate pl-3 font-mono text-[10.5px]" style={{ color: "var(--ink-muted)" }}>
      {children}
    </span>
  );
}

/**
 * ⌘K palette over a prebuilt index — pure props, zero fetching.
 * Also opens on the window 'palette-open' custom event.
 */
export function CommandPalette({ items }: { items: SearchItem[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpenEvent = () => setOpen(true);
    document.addEventListener("keydown", onKey);
    window.addEventListener(PALETTE_OPEN_EVENT, onOpenEvent);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener(PALETTE_OPEN_EVENT, onOpenEvent);
    };
  }, []);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };
  const run = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  // items arrive pre-sorted: projects are most-recently-updated first.
  const projects = items.filter((i) => i.type === "project");
  const shownProjects = query.trim() === "" ? projects.slice(0, 5) : projects;
  const folders = items.filter((i) => i.type === "folder");
  const tags = items.filter((i) => i.type === "tag");
  const people = items.filter((i) => i.type === "person");

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
      overlayClassName="fixed inset-0 z-50 backdrop-blur-[2px] [background:color-mix(in_srgb,var(--canvas)_55%,transparent)]"
      contentClassName="fixed left-1/2 top-[14%] z-50 w-[600px] max-w-[calc(100vw-32px)] -translate-x-1/2"
      className="overflow-hidden rounded-[14px] border border-[var(--line)] bg-[var(--surface-raised)] shadow-[0_24px_64px_rgba(0,0,0,0.22)]"
    >
      <Command.Input
        value={query}
        onValueChange={setQuery}
        placeholder="Search projects, folders, tags, people — or run an action…"
        className="h-12 w-full border-b border-[var(--line)] bg-transparent px-4 text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-muted)]"
      />
      <Command.List className="max-h-[380px] overflow-y-auto overscroll-contain p-1.5 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-[var(--ink-muted)]">
        <Command.Empty className="py-8 text-center text-[13px] text-[var(--ink-muted)]">
          Nothing matches.
        </Command.Empty>

        <Command.Group heading="Projects">
          {shownProjects.map((i) => (
            <Command.Item
              key={`project-${i.id}`}
              value={`project-${i.id}-${i.label}`}
              keywords={[i.label, ...i.keywords]}
              onSelect={() => go(i.href)}
              className={itemClass}
            >
              {i.health && <HealthGlyph dh={i.health} size={12} />}
              <span className="truncate">{i.label}</span>
              {i.sublabel && <Sublabel>{i.sublabel}</Sublabel>}
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Actions">
          <Command.Item
            value="action-new-project"
            keywords={["new", "project", "create", "add"]}
            onSelect={() => go("/new")}
            className={itemClass}
          >
            <Plus size={14} strokeWidth={2} style={{ color: "var(--ink-muted)" }} />
            New project
          </Command.Item>
          <Command.Item
            value="action-quick-create"
            keywords={["quick", "create", "fast", "capture"]}
            onSelect={() => run(() => window.dispatchEvent(new Event("quick-create-open")))}
            className={itemClass}
          >
            <Zap size={14} strokeWidth={2} style={{ color: "var(--ink-muted)" }} />
            Quick create
          </Command.Item>
          <Command.Item
            value="action-toggle-theme"
            keywords={["theme", "dark", "light", "mode", "toggle"]}
            onSelect={() => run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))}
            className={itemClass}
          >
            <SunMoon size={14} strokeWidth={2} style={{ color: "var(--ink-muted)" }} />
            Toggle theme
          </Command.Item>
          <Command.Item
            value="action-go-home"
            keywords={["home", "all projects", "dashboard"]}
            onSelect={() => go("/")}
            className={itemClass}
          >
            <Home size={14} strokeWidth={2} style={{ color: "var(--ink-muted)" }} />
            Go home
          </Command.Item>
        </Command.Group>

        <Command.Group heading="Folders">
          {folders.map((i) => (
            <Command.Item
              key={`folder-${i.id}`}
              value={`folder-${i.id}-${i.label}`}
              keywords={i.keywords}
              onSelect={() => go(i.href)}
              className={itemClass}
            >
              <Folder size={14} strokeWidth={1.75} style={{ color: "var(--ink-muted)" }} />
              <span className="truncate">{i.label}</span>
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Tags">
          {tags.map((i) => (
            <Command.Item
              key={`tag-${i.id}`}
              value={`tag-${i.id}-${i.label}`}
              keywords={i.keywords}
              onSelect={() => go(i.href)}
              className={itemClass}
            >
              <Tag size={14} strokeWidth={1.75} style={{ color: "var(--ink-muted)" }} />
              <span className="truncate font-mono text-[12px]">{i.label}</span>
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="People">
          {people.map((i) => (
            <Command.Item
              key={`person-${i.id}`}
              value={`person-${i.id}-${i.label}`}
              keywords={i.keywords}
              onSelect={() => go(i.href)}
              className={itemClass}
            >
              <User size={14} strokeWidth={1.75} style={{ color: "var(--ink-muted)" }} />
              <span className="truncate">{i.label}</span>
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>

      <div
        className="flex items-center gap-3 border-t px-3 py-2 font-mono text-[10px] uppercase tracking-[0.08em]"
        style={{ borderColor: "var(--line)", color: "var(--ink-muted)" }}
      >
        <span>↑↓ navigate</span>
        <span>↵ open</span>
        <span className="ml-auto">esc close</span>
      </div>
    </Command.Dialog>
  );
}
