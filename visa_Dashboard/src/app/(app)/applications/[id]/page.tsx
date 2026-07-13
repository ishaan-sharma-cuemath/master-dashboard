import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/applications/DeleteButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireUser } from "@/lib/auth-dal";
import { fmtDate, fmtMoney, fmtValidity } from "@/lib/format";
import { getApplication } from "@/lib/queries";
import { deriveStage } from "@/lib/stage";

export const dynamic = "force-dynamic";

export default async function ApplicationDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const a = getApplication(id);
  if (!a) notFound();

  const stage = deriveStage(a);

  return (
    <div className="mx-auto max-w-[900px]">
      <Link
        href="/applications"
        className="inline-flex items-center gap-1.5 text-[13px] transition-colors hover:text-[var(--ink)]"
        style={{ color: "var(--ink-muted)" }}
      >
        <ArrowLeft size={14} /> Applications
      </Link>

      <header className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-[24px] font-semibold tracking-[-0.01em]">{a.name}</h1>
        <StatusBadge value={a.finalResult} />
        <StatusBadge value={stage.label} tone={stage.tone} size="sm" />
        <div className="ml-auto flex items-center gap-2.5">
          <Link href={`/applications/${a.id}/edit`} className="btn btn-ghost">
            <Pencil size={15} /> Edit
          </Link>
          <DeleteButton id={a.id} name={a.name} />
        </div>
      </header>
      <p className="mt-1 font-mono text-[12px]" style={{ color: "var(--ink-muted)" }}>
        {a.email}
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex flex-col gap-5">
          {a.formRequired && (
            <Card title="Form">
              <Row label="Form" value={a.formName ?? "—"} />
              <Row label="Fill-up" badge={a.formFillup} />
              <Row label="Submission" badge={a.formSubmission} />
            </Card>
          )}

          {a.biometricRequired && (
            <Card title="Biometric">
              <Row label="Status" badge={a.biometricStatus} />
              <Row label="Date" value={fmtDate(a.biometricDate)} />
              <Row label="Location" value={a.biometricLocation ?? "—"} />
            </Card>
          )}

          {a.interviewRequired && (
            <Card title="Interview">
              <Row label="Status" badge={a.interviewStatus} />
              <Row label="Date" value={fmtDate(a.interviewDate)} />
              <Row label="Location" value={a.interviewLocation ?? "—"} />
            </Card>
          )}

          <Card title="Costs">
            <Row label="Vendor fees" value={fmtMoney(a.vendorFees)} mono />
            <Row label="Visa fees" value={fmtMoney(a.visaFees)} mono />
            <Row label="Flight cost" value={fmtMoney(a.flightCost)} mono />
            <Row label="Stay" value={a.stayDays ? `${a.stayDays} days` : "—"} />
          </Card>

          {a.notes && (
            <Card title="Notes">
              <p className="text-[13.5px] leading-relaxed">{a.notes}</p>
            </Card>
          )}
        </div>

        <aside>
          <Card title="Properties">
            <Row label="Country" value={a.country} />
            <Row label="Visa type" value={a.visaType} />
            <Row label="Vendor" value={a.vendor ?? "—"} />
            <Row label="Approved by" value={a.approvedBy ?? "—"} />
            <Row label="Validity" value={fmtValidity(a.validFrom, a.validTo)} mono />
            <Row label="Doc signed" badge={a.docSigned} />
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <div className="microlabel">{title}</div>
      <div className="mt-3 flex flex-col gap-2.5">{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
  badge,
  mono,
}: {
  label: string;
  value?: string;
  badge?: string | null;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[13px]">
      <span style={{ color: "var(--ink-muted)" }}>{label}</span>
      {badge !== undefined ? (
        <StatusBadge value={badge} size="sm" />
      ) : (
        <span className={`text-right ${mono ? "font-mono text-[12px]" : ""}`}>{value}</span>
      )}
    </div>
  );
}
