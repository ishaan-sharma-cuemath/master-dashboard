import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

/** Quiet group header: colored dot + name + count + hairline rule. */
export function FolderSection({
  title,
  color,
  count,
  children,
}: {
  title: string;
  color?: string | null;
  count: number;
  children: ReactNode;
}) {
  return (
    <details open className="group">
      <summary className="flex cursor-pointer select-none list-none items-center gap-2.5 py-1 [&::-webkit-details-marker]:hidden">
        <ChevronRight
          size={13}
          strokeWidth={2}
          className="transition-transform duration-150 group-open:rotate-90"
          style={{ color: "var(--ink-muted)" }}
        />
        <span className="h-2 w-2 rounded-full" style={{ background: color ?? "var(--line-strong)" }} />
        <h2 className="text-[14px] font-semibold tracking-[-0.01em]" style={{ color: "var(--ink)" }}>
          {title}
        </h2>
        <span className="text-[12px] tabular-nums" style={{ color: "var(--ink-muted)" }}>
          {count}
        </span>
        <span className="ml-1 h-px flex-1" style={{ background: "var(--line)" }} />
      </summary>
      <div className="mt-3.5 grid gap-3.5 pb-1" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(268px, 1fr))" }}>
        {children}
      </div>
    </details>
  );
}
