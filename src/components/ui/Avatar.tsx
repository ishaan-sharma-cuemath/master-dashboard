import type { PersonRow } from "@/lib/db/schema";
import { initials } from "@/lib/format";

export function Avatar({ person, size = 20 }: { person: PersonRow; size?: number }) {
  return (
    <span
      title={person.name}
      className="inline-flex items-center justify-center rounded-full font-mono font-medium text-white shrink-0 select-none"
      style={{
        width: size,
        height: size,
        background: person.avatarColor,
        fontSize: Math.max(8, Math.round(size * 0.42)),
      }}
    >
      {initials(person.name)}
    </span>
  );
}

export function AvatarStack({ people, size = 20, max = 4 }: { people: PersonRow[]; size?: number; max?: number }) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <span className="inline-flex items-center">
      {shown.map((p, i) => (
        <span key={p.id} style={{ marginLeft: i === 0 ? 0 : -size * 0.3 }} className="rounded-full ring-2 ring-[var(--surface)]">
          <Avatar person={p} size={size} />
        </span>
      ))}
      {extra > 0 && (
        <span className="ml-1 font-mono text-[10px]" style={{ color: "var(--ink-muted)" }}>
          +{extra}
        </span>
      )}
    </span>
  );
}
