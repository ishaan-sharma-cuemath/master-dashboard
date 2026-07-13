"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { VisaApplicationRow } from "@/lib/db/schema";
import { fmtMoney, fmtValidity } from "@/lib/format";
import { deriveStage } from "@/lib/stage";

export function ApplicationsTable({ apps }: { apps: VisaApplicationRow[] }) {
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [result, setResult] = useState("");

  const countries = useMemo(() => [...new Set(apps.map((a) => a.country))].sort(), [apps]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return apps.filter((a) => {
      if (country && a.country !== country) return false;
      if (result && a.finalResult !== result) return false;
      if (needle) {
        const hay = `${a.name} ${a.email} ${a.country} ${a.visaType} ${a.vendor ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [apps, q, country, result]);

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-muted)" }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, type, vendor…"
            className="field pl-8"
          />
        </div>
        <select value={country} onChange={(e) => setCountry(e.target.value)} className="field w-auto">
          <option value="">All countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={result} onChange={(e) => setResult(e.target.value)} className="field w-auto">
          <option value="">All results</option>
          <option value="Process not Started">In progress</option>
          <option value="VISA Granted">Granted</option>
          <option value="VISA Rejected">Rejected</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr style={{ color: "var(--ink-muted)" }} className="text-left">
                <Th>Applicant</Th>
                <Th>Country</Th>
                <Th>Visa type</Th>
                <Th>Stage</Th>
                <Th>Result</Th>
                <Th>Vendor</Th>
                <Th className="text-right">Visa fees</Th>
                <Th>Validity</Th>
                <Th>Doc</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const stage = deriveStage(a);
                return (
                  <tr
                    key={a.id}
                    className="border-t transition-colors hover:bg-[var(--accent-soft)]"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <Td>
                      <Link href={`/applications/${a.id}`} className="block">
                        <div className="font-medium" style={{ color: "var(--ink)" }}>
                          {a.name}
                        </div>
                        <div className="font-mono text-[11px]" style={{ color: "var(--ink-muted)" }}>
                          {a.email}
                        </div>
                      </Link>
                    </Td>
                    <Td>{a.country}</Td>
                    <Td>{a.visaType}</Td>
                    <Td>
                      <StatusBadge value={stage.label} tone={stage.tone} size="sm" />
                    </Td>
                    <Td>
                      <StatusBadge value={a.finalResult} size="sm" />
                    </Td>
                    <Td>{a.vendor ?? "—"}</Td>
                    <Td className="text-right font-mono">{fmtMoney(a.visaFees)}</Td>
                    <Td className="whitespace-nowrap font-mono text-[11.5px]" muted>
                      {fmtValidity(a.validFrom, a.validTo)}
                    </Td>
                    <Td>
                      <StatusBadge value={a.docSigned} size="sm" />
                    </Td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-[13px]" style={{ color: "var(--ink-muted)" }}>
                    No applications match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[12px]" style={{ color: "var(--ink-muted)" }}>
        {rows.length} of {apps.length} applications
      </p>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide ${className}`}>{children}</th>;
}

function Td({
  children,
  className = "",
  muted,
}: {
  children: React.ReactNode;
  className?: string;
  muted?: boolean;
}) {
  return (
    <td className={`px-4 py-3 align-middle ${className}`} style={muted ? { color: "var(--ink-muted)" } : undefined}>
      {children}
    </td>
  );
}
