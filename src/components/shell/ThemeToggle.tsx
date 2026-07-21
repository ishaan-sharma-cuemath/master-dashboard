"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const ORDER = ["system", "light", "dark"] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const current = (mounted ? theme : "system") ?? "system";
  const next = ORDER[(ORDER.indexOf(current as (typeof ORDER)[number]) + 1) % ORDER.length];
  const Icon = current === "light" ? Sun : current === "dark" ? Moon : Monitor;

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      title={`Theme: ${current}, click for ${next}`}
      className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border transition-colors hover:border-[var(--line-strong)]"
      style={{ borderColor: "var(--line)", color: "var(--ink-secondary)" }}
    >
      <Icon size={15} strokeWidth={1.5} />
    </button>
  );
}
