import Link from "next/link";
import { Plus, UploadCloud } from "lucide-react";
import { ApplicationsTable } from "@/components/applications/ApplicationsTable";
import { requireUser } from "@/lib/auth-dal";
import { getApplications } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  await requireUser();
  const apps = getApplications();

  return (
    <div>
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <h1 className="text-[21px] font-semibold tracking-[-0.01em]">Applications</h1>
        <div className="flex items-center gap-2.5">
          <Link href="/import" className="btn btn-ghost">
            <UploadCloud size={15} /> Import
          </Link>
          <Link href="/new" className="btn btn-primary">
            <Plus size={15} /> New application
          </Link>
        </div>
      </div>
      {apps.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-[14px] font-medium">No applications yet</p>
          <p className="mt-1 text-[13px]" style={{ color: "var(--ink-muted)" }}>
            Add your first visa application to start tracking.
          </p>
          <Link href="/new" className="btn btn-primary mx-auto mt-4 w-fit">
            <Plus size={15} /> New application
          </Link>
        </div>
      ) : (
        <ApplicationsTable apps={apps} />
      )}
    </div>
  );
}
