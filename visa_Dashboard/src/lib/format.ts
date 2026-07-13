// Lightweight formatting helpers.

export function fmtMoney(n: number | null | undefined, currency = "₹"): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `${currency}${n.toLocaleString("en-IN")}`;
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso; // tolerate free-text dates
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtValidity(from: string | null | undefined, to: string | null | undefined): string {
  if (!from && !to) return "—";
  return `${fmtDate(from)} → ${fmtDate(to)}`;
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
