"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const order = ["system", "light", "dark"] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const current = (theme ?? "system") as (typeof order)[number];
  const Icon = current === "light" ? Sun : current === "dark" ? Moon : Monitor;

  return (
    <button
      type="button"
      aria-label={`Theme: ${current}. Click to change.`}
      title={`Theme: ${current}`}
      onClick={() => {
        const next = order[(order.indexOf(current) + 1) % order.length];
        setTheme(next);
      }}
      className="grid h-8 w-8 place-items-center rounded-[9px] border transition-colors hover:border-[var(--ink-muted)]"
      style={{ borderColor: "var(--line-strong)", color: "var(--ink-secondary)" }}
    >
      {mounted ? <Icon size={15} /> : <Monitor size={15} />}
    </button>
  );
}
