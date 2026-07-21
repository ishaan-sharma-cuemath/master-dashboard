import { colorFor } from "./Donut";

type Item = { label: string; value: number };

/** Horizontal bar chart of how many items sit at each stage (the pipeline funnel). */
export function StageBars({ items }: { items: Item[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-[130px] shrink-0 truncate text-right text-[12.5px]" style={{ color: "var(--ink-secondary)" }}>
            {it.label}
          </span>
          <div className="relative h-[18px] flex-1 overflow-hidden rounded-[5px]" style={{ background: "var(--line)" }}>
            <div
              className="h-full rounded-[5px]"
              style={{ width: `${(it.value / max) * 100}%`, minWidth: it.value > 0 ? 4 : 0, background: colorFor(it.label), opacity: 0.85 }}
            />
          </div>
          <span className="w-8 shrink-0 font-mono text-[12.5px] font-semibold tabular-nums" style={{ color: "var(--ink)" }}>
            {it.value}
          </span>
        </div>
      ))}
    </div>
  );
}
