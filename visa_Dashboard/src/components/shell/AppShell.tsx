"use client";

import { LayoutDashboard, LogOut, Plus, Table2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/lib/actions/auth";
import { ThemeToggle } from "./ThemeToggle";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applications", label: "Applications", icon: Table2 },
];

export function AppShell({ children, userEmail }: { children: React.ReactNode; userEmail?: string }) {
  const pathname = usePathname();

  return (
    <div className="min-h-full">
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-md"
        style={{ borderColor: "var(--line)", background: "color-mix(in srgb, var(--canvas) 82%, transparent)" }}
      >
        <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-4 px-4 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span
              className="grid h-7 w-7 place-items-center rounded-[8px] text-[13px] font-bold"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              V
            </span>
            <span className="text-[15px] font-semibold tracking-[-0.01em]">Visa Tracker</span>
          </Link>

          <nav className="ml-2 flex items-center gap-1">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[13px] transition-colors"
                  style={{
                    background: active ? "var(--accent-soft)" : "transparent",
                    color: active ? "var(--accent)" : "var(--ink-secondary)",
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  <Icon size={15} /> {label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2.5">
            {userEmail && (
              <span
                className="hidden max-w-[190px] truncate font-mono text-[11.5px] sm:inline"
                style={{ color: "var(--ink-muted)" }}
                title={userEmail}
              >
                {userEmail}
              </span>
            )}
            <ThemeToggle />
            <Link href="/new" className="btn btn-primary">
              <Plus size={15} /> New application
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                aria-label="Sign out"
                title="Sign out"
                className="grid h-8 w-8 place-items-center rounded-[9px] border transition-colors hover:border-[var(--ink-muted)]"
                style={{ borderColor: "var(--line-strong)", color: "var(--ink-secondary)" }}
              >
                <LogOut size={15} />
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 py-7 lg:px-8">{children}</main>
    </div>
  );
}
