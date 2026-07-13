"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  name: string;
  presets: readonly string[];
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  id?: string;
  onValueChange?: (value: string) => void;
};

/**
 * Text field with preset suggestions. The user can pick a preset or type a
 * brand-new value; whatever ends up in the input is submitted under `name`.
 * New (non-preset) values are persisted server-side on form submit so they
 * show up as presets next time.
 */
export function Combobox({ name, presets, defaultValue = "", placeholder, required, id, onValueChange }: Props) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function commit(v: string) {
    setValue(v);
    onValueChange?.(v);
  }

  const q = value.trim().toLowerCase();
  const filtered = q ? presets.filter((p) => p.toLowerCase().includes(q)) : presets;
  const isNew = value.trim().length > 0 && !presets.some((p) => p.toLowerCase() === q);

  return (
    <div ref={wrapRef} className="relative">
      <input type="hidden" name={name} value={value} />
      <div className="relative">
        <input
          id={id}
          type="text"
          className="field pr-8"
          placeholder={placeholder}
          value={value}
          required={required}
          autoComplete="off"
          onChange={(e) => {
            commit(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "Enter" && open) {
              e.preventDefault();
              setOpen(false);
            }
          }}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label="Toggle options"
          onClick={() => setOpen((o) => !o)}
          className="absolute right-2 top-1/2 -translate-y-1/2"
          style={{ color: "var(--ink-muted)" }}
        >
          <ChevronDown size={15} />
        </button>
      </div>

      {open && (filtered.length > 0 || isNew) && (
        <div
          className="absolute z-40 mt-1 max-h-56 w-full overflow-auto rounded-[10px] border p-1 shadow-[var(--shadow)]"
          style={{ background: "var(--surface-raised)", borderColor: "var(--line-strong)" }}
        >
          {filtered.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                commit(p);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-[7px] px-2.5 py-1.5 text-left text-[13px] transition-colors hover:bg-[var(--accent-soft)]"
            >
              <Check size={13} style={{ opacity: value === p ? 1 : 0, color: "var(--accent)" }} />
              <span className="truncate">{p}</span>
            </button>
          ))}
          {isNew && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-[7px] px-2.5 py-1.5 text-left text-[13px] transition-colors hover:bg-[var(--accent-soft)]"
              style={{ color: "var(--ink-secondary)" }}
            >
              <span
                className="rounded-[5px] px-1.5 py-px text-[10px] font-medium"
                style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
              >
                new
              </span>
              Use &ldquo;{value.trim()}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
