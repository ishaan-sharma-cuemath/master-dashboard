import type { FolderRow } from "@/lib/db/schema";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";

export type SidebarFolder = { folder: FolderRow; count: number };

const VIEWS: { label: string; href: string; key: string }[] = [
  { label: "All projects", href: "/", key: "all" },
  { label: "Completed", href: "/?lifecycle=completed", key: "completed" },
];

export function AppShell({
  folders,
  activeFolderId,
  activeView = "all",
  searchQuery,
  children,
}: {
  folders: SidebarFolder[];
  activeFolderId?: string;
  activeView?: string;
  searchQuery?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* ————— Sidebar ————— */}
      <aside
        className="sticky top-0 hidden h-screen w-[224px] shrink-0 flex-col border-r lg:flex"
        style={{ borderColor: "var(--line)", background: "var(--canvas)" }}
      >
        <Link href="/" className="flex items-center gap-2.5 px-3 pb-4 pt-5">
          <span
            className="grid h-[26px] w-[26px] place-items-center rounded-[8px] text-[14px] font-bold tracking-[-0.03em]"
            style={{ background: "var(--btn)", color: "var(--btn-ink)" }}
          >
            A
          </span>
          <span className="text-[14.5px] font-semibold tracking-[-0.02em]">Akash&apos;s Dashboard</span>
        </Link>

        <nav className="flex-1 overflow-y-auto px-2.5 pb-4">
          {VIEWS.map((v) => (
            <Link
              key={v.key}
              href={v.href}
              className="flex items-center gap-2.5 rounded-[9px] px-2.5 py-[7px] text-[13.5px] transition-colors"
              style={
                activeView === v.key && !activeFolderId
                  ? { background: "var(--surface)", color: "var(--ink)", fontWeight: 550, boxShadow: "var(--shadow)" }
                  : { color: "var(--ink-secondary)" }
              }
            >
              {v.label}
            </Link>
          ))}

          <div className="px-2.5 pb-2 pt-5 text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
            Folders
          </div>
          {folders.map(({ folder, count }) => (
            <Link
              key={folder.id}
              href={`/?folder=${folder.id}`}
              className="flex items-center gap-2.5 rounded-[9px] px-2.5 py-[6px] text-[13px] transition-colors"
              style={
                activeFolderId === folder.id
                  ? { background: "var(--surface)", color: "var(--ink)", fontWeight: 550, boxShadow: "var(--shadow)" }
                  : { color: "var(--ink-secondary)" }
              }
            >
              <span
                className="h-[7px] w-[7px] shrink-0 rounded-full"
                style={{ background: folder.color ?? "var(--line-strong)" }}
              />
              <span className="truncate">{folder.name}</span>
              <span className="ml-auto text-[11.5px] tabular-nums" style={{ color: "var(--ink-muted)" }}>
                {count}
              </span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* ————— Main ————— */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="sticky top-0 z-10 flex h-15 items-center gap-3 border-b px-4 py-3 backdrop-blur-md lg:px-6"
          style={{ borderColor: "var(--line)", background: "color-mix(in srgb, var(--canvas) 82%, transparent)" }}
        >
          <form action="/" className="relative w-full max-w-[420px]">
            <Search
              size={15}
              strokeWidth={1.8}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--ink-muted)" }}
            />
            <input
              type="search"
              name="q"
              defaultValue={searchQuery}
              placeholder="Search projects…"
              className="h-[34px] w-full rounded-[9px] border pl-9 pr-3 text-[13px] outline-none transition-colors placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)]"
              style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)", boxShadow: "var(--shadow)" }}
            />
          </form>

          <div className="ml-auto flex items-center gap-2.5">
            <ThemeToggle />
            <Link
              href="/new"
              className="inline-flex h-[34px] items-center gap-1.5 rounded-[9px] px-3.5 text-[13px] font-semibold transition-opacity hover:opacity-90"
              style={{ background: "var(--btn)", color: "var(--btn-ink)", boxShadow: "var(--shadow)" }}
            >
              <Plus size={15} strokeWidth={2.5} />
              New project
            </Link>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
