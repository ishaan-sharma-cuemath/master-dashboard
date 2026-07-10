import Link from "next/link";

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-2 border-dashed px-8 py-16 text-center" style={{ borderStyle: "dashed" }}>
      <div className="text-[15px] font-semibold">{title}</div>
      <div className="max-w-sm text-[13px]" style={{ color: "var(--ink-muted)" }}>
        {hint}
      </div>
      {action && (
        <Link
          href={action.href}
          className="mt-3 rounded-[8px] px-3.5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--accent)" }}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
