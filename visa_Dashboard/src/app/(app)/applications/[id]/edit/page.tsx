import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { VisaForm } from "@/components/form/VisaForm";
import { updateApplication } from "@/lib/actions/applications";
import { requireUser } from "@/lib/auth-dal";
import { getApplication, getPresets } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EditApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const a = getApplication(id);
  if (!a) notFound();
  const presets = getPresets();
  const action = updateApplication.bind(null, id);

  return (
    <div className="mx-auto max-w-[820px]">
      <Link
        href={`/applications/${id}`}
        className="inline-flex items-center gap-1.5 text-[13px] transition-colors hover:text-[var(--ink)]"
        style={{ color: "var(--ink-muted)" }}
      >
        <ArrowLeft size={14} /> Back to application
      </Link>
      <h1 className="mt-4 mb-5 text-[21px] font-semibold tracking-[-0.01em]">Edit application</h1>
      <VisaForm
        presets={presets}
        action={action}
        application={a}
        submitLabel="Save changes"
        cancelHref={`/applications/${id}`}
      />
    </div>
  );
}
