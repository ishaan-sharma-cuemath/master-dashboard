import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { VisaForm } from "@/components/form/VisaForm";
import { createApplication } from "@/lib/actions/applications";
import { requireUser } from "@/lib/auth-dal";
import { getPresets } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function NewApplicationPage() {
  await requireUser();
  const presets = getPresets();

  return (
    <div className="mx-auto max-w-[820px]">
      <Link
        href="/applications"
        className="inline-flex items-center gap-1.5 text-[13px] transition-colors hover:text-[var(--ink)]"
        style={{ color: "var(--ink-muted)" }}
      >
        <ArrowLeft size={14} /> Applications
      </Link>
      <h1 className="mt-4 mb-5 text-[21px] font-semibold tracking-[-0.01em]">New visa application</h1>
      <VisaForm presets={presets} action={createApplication} />
    </div>
  );
}
