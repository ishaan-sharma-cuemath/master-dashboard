import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ImportClient } from "@/components/import/ImportClient";
import { requireUser } from "@/lib/auth-dal";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-[900px]">
      <Link
        href="/applications"
        className="inline-flex items-center gap-1.5 text-[13px] transition-colors hover:text-[var(--ink)]"
        style={{ color: "var(--ink-muted)" }}
      >
        <ArrowLeft size={14} /> Applications
      </Link>
      <h1 className="mt-4 text-[21px] font-semibold tracking-[-0.01em]">Import from Excel</h1>
      <p className="mt-1 mb-5 text-[13px]" style={{ color: "var(--ink-muted)" }}>
        Upload the tracking sheet (.xlsx or .csv). Columns are matched by their header names, and you&rsquo;ll see a
        preview before anything is saved.
      </p>
      <ImportClient />
    </div>
  );
}
