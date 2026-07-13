"use client";

import { AlertTriangle, CheckCircle2, FileUp, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { importApplications, type ImportResult } from "@/lib/actions/import";
import { mapRecord, type RawRecord } from "@/lib/import";

export function ImportClient() {
  const [records, setRecords] = useState<RawRecord[]>([]);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError("");
    setResult(null);
    setFileName(file.name);
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<RawRecord>(ws, { defval: "", raw: false });
      setRecords(rows);
    } catch {
      setRecords([]);
      setParseError("Couldn't read that file — export the sheet as .xlsx or .csv and try again.");
    }
  }

  const mapped = records.map(mapRecord);
  const valid = mapped.filter((m) => m.row);
  const skipped = mapped.filter((m) => m.skip);

  function doImport() {
    startTransition(async () => {
      setResult(await importApplications(records));
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Dropzone / file picker */}
      <section className="card p-6">
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={onFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed py-8 transition-colors hover:border-[var(--accent)]"
          style={{ borderColor: "var(--line-strong)" }}
        >
          <UploadCloud size={26} style={{ color: "var(--ink-muted)" }} />
          <span className="text-[14px] font-medium">Choose an Excel or CSV file</span>
          <span className="text-[12.5px]" style={{ color: "var(--ink-muted)" }}>
            .xlsx or .csv — the tracking sheet with its header row
          </span>
        </button>
        {fileName && (
          <p className="mt-3 flex items-center gap-1.5 text-[12.5px]" style={{ color: "var(--ink-secondary)" }}>
            <FileUp size={13} /> {fileName}
          </p>
        )}
        {parseError && (
          <p
            className="mt-3 flex items-center gap-1.5 rounded-[9px] px-3 py-2 text-[12.5px]"
            style={{ background: "var(--health-red-soft)", color: "var(--health-red-text)" }}
          >
            <AlertTriangle size={14} /> {parseError}
          </p>
        )}
      </section>

      {/* Result (after import) */}
      {result && (
        <section
          className="card p-5"
          style={{ borderColor: "var(--health-green)", background: "var(--health-green-soft)" }}
        >
          <div className="flex items-center gap-2 text-[14px] font-semibold" style={{ color: "var(--health-green-text)" }}>
            <CheckCircle2 size={17} /> Imported {result.imported} application{result.imported === 1 ? "" : "s"}
          </div>
          <p className="mt-1 text-[12.5px]" style={{ color: "var(--ink-secondary)" }}>
            {result.duplicates} duplicate{result.duplicates === 1 ? "" : "s"} skipped · {result.skipped} row
            {result.skipped === 1 ? "" : "s"} skipped
          </p>
          {result.messages.length > 0 && (
            <ul className="mt-3 flex max-h-40 flex-col gap-0.5 overflow-auto font-mono text-[11px]" style={{ color: "var(--ink-muted)" }}>
              {result.messages.map((m, i) => (
                <li key={i}>· {m}</li>
              ))}
            </ul>
          )}
          <Link href="/applications" className="btn btn-primary mt-4 w-fit">
            View applications
          </Link>
        </section>
      )}

      {/* Preview (before import) */}
      {!result && records.length > 0 && (
        <section className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="microlabel">Preview</div>
            <div className="flex items-center gap-3 text-[12.5px]">
              <span style={{ color: "var(--health-green-text)" }}>{valid.length} ready</span>
              {skipped.length > 0 && <span style={{ color: "var(--health-amber-text)" }}>{skipped.length} skipped</span>}
            </div>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr className="text-left" style={{ color: "var(--ink-muted)" }}>
                  <th className="px-2 py-1.5 font-medium">Name</th>
                  <th className="px-2 py-1.5 font-medium">Country</th>
                  <th className="px-2 py-1.5 font-medium">Visa type</th>
                  <th className="px-2 py-1.5 font-medium">Vendor</th>
                  <th className="px-2 py-1.5 font-medium">Result</th>
                </tr>
              </thead>
              <tbody>
                {valid.slice(0, 12).map((m, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: "var(--line)" }}>
                    <td className="px-2 py-1.5">{m.row!.name}</td>
                    <td className="px-2 py-1.5">{m.row!.country}</td>
                    <td className="px-2 py-1.5">{m.row!.visaType}</td>
                    <td className="px-2 py-1.5">{m.row!.vendor ?? "—"}</td>
                    <td className="px-2 py-1.5">{m.row!.finalResult}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {valid.length > 12 && (
              <p className="mt-2 text-[12px]" style={{ color: "var(--ink-muted)" }}>
                …and {valid.length - 12} more
              </p>
            )}
          </div>

          {skipped.length > 0 && (
            <ul className="mt-3 flex flex-col gap-0.5 text-[11.5px]" style={{ color: "var(--health-amber-text)" }}>
              {skipped.slice(0, 8).map((m, i) => (
                <li key={i}>· {m.skip}</li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex items-center gap-2.5">
            <button type="button" className="btn btn-primary" onClick={doImport} disabled={pending || valid.length === 0}>
              {pending ? "Importing…" : `Import ${valid.length} application${valid.length === 1 ? "" : "s"}`}
            </button>
            <span className="text-[12px]" style={{ color: "var(--ink-muted)" }}>
              Duplicates (same email + visa type) are skipped automatically.
            </span>
          </div>
        </section>
      )}
    </div>
  );
}
