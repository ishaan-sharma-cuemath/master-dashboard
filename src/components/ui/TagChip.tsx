import type { TagRow } from "@/lib/db/schema";

export function TagChip({ tag }: { tag: TagRow }) {
  return (
    <span
      title={tag.definition ?? tag.name}
      className="inline-flex items-center rounded-[6px] border px-1.5 py-px font-mono text-[10.5px] leading-[16px]"
      style={{ borderColor: "var(--line)", color: "var(--ink-secondary)", background: "var(--surface-raised)" }}
    >
      {tag.name}
    </span>
  );
}

export function LinkFavicon({ url, label }: { url: string; label?: string }) {
  let domain = "";
  try {
    domain = new URL(url).hostname;
  } catch {
    return null;
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={label ? `${label} ↗` : `${domain} ↗`}
      className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-[4px] border transition-colors hover:border-[var(--line-strong)]"
      style={{ borderColor: "var(--line)", background: "var(--surface-raised)" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt={label ?? domain} width={11} height={11} className="rounded-[2px]" />
    </a>
  );
}
