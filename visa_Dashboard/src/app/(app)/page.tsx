import Link from "next/link";
import { Plus } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireUser } from "@/lib/auth-dal";
import { fmtMoney } from "@/lib/format";
import { getApplications, getStats, type CountryStat } from "@/lib/queries";

export const dynamic = "force-dynamic";

const RESULT_COLORS = {
  granted: "var(--health-green)",
  inProgress: "var(--health-blue)",
  rejected: "var(--health-red)",
};

export default async function DashboardPage() {
  await requireUser();
  const apps = getApplications();
  const stats = getStats(apps);

  if (stats.total === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="text-[14px] font-medium">Nothing to show yet</p>
        <p className="mt-1 text-[13px]" style={{ color: "var(--ink-muted)" }}>
          Add a visa application and the dashboard will fill in.
        </p>
        <Link href="/new" className="btn btn-primary mx-auto mt-4 w-fit">
          <Plus size={15} /> New application
        </Link>
      </div>
    );
  }

  const maxCountryTotal = Math.max(...stats.byCountry.map((c) => c.total), 1);
  const maxStage = Math.max(...stats.byStage.map((s) => s.count), 1);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-[21px] font-semibold tracking-[-0.01em]">Dashboard</h1>
        <span className="text-[12.5px]" style={{ color: "var(--ink-muted)" }}>
          {stats.total} applications · {stats.byCountry.length} countries
        </span>
      </div>

      {/* Stat tiles */}
      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <StatTile label="Total" value={stats.total} />
        <StatTile label="Granted" value={stats.granted} tone="green" />
        <StatTile label="In progress" value={stats.inProgress} tone="blue" />
        <StatTile label="Rejected" value={stats.rejected} tone="red" />
        <StatTile label="Visa fees" value={fmtMoney(stats.totalVisaFees)} />
        <StatTile label="Vendor fees" value={fmtMoney(stats.totalVendorFees)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        {/* Visas by country */}
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <div className="microlabel">Visas by country</div>
            <Legend />
          </div>
          <div className="mt-4 flex flex-col gap-3.5">
            {stats.byCountry.map((c) => (
              <CountryRow key={c.country} c={c} max={maxCountryTotal} />
            ))}
          </div>
        </section>

        {/* Pipeline */}
        <section className="card p-5">
          <div className="microlabel">Pipeline</div>
          <div className="mt-4 flex flex-col gap-3">
            {stats.byStage.map((s) => (
              <div key={s.key} className="flex items-center gap-3">
                <span className="w-36 shrink-0 text-[12.5px]" style={{ color: "var(--ink-secondary)" }}>
                  {s.label}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(s.count / maxStage) * 100}%`, background: "var(--accent)" }}
                  />
                </div>
                <span className="w-6 text-right font-mono text-[12px]" style={{ color: "var(--ink-secondary)" }}>
                  {s.count}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Recent */}
      <section className="card p-5">
        <div className="microlabel">Recently added</div>
        <div className="mt-3 flex flex-col">
          {apps.slice(0, 6).map((a) => (
            <Link
              key={a.id}
              href={`/applications/${a.id}`}
              className="flex items-center gap-3 border-b py-2.5 text-[13px] last:border-b-0 transition-colors hover:bg-[var(--accent-soft)]"
              style={{ borderColor: "var(--line)" }}
            >
              <span className="min-w-0 flex-1 truncate font-medium">{a.name}</span>
              <span className="w-40 truncate" style={{ color: "var(--ink-secondary)" }}>
                {a.country}
              </span>
              <span className="w-28 truncate" style={{ color: "var(--ink-muted)" }}>
                {a.visaType}
              </span>
              <StatusBadge value={a.finalResult} size="sm" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatTile({ label, value, tone }: { label: string; value: string | number; tone?: "green" | "blue" | "red" }) {
  const color =
    tone === "green"
      ? "var(--health-green-text)"
      : tone === "blue"
        ? "var(--health-blue-text)"
        : tone === "red"
          ? "var(--health-red-text)"
          : "var(--ink)";
  return (
    <div className="card p-4">
      <div className="microlabel">{label}</div>
      <div className="mt-1.5 text-[24px] font-semibold tracking-[-0.02em]" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function CountryRow({ c, max }: { c: CountryStat; max: number }) {
  const seg = (n: number) => `${(n / max) * 100}%`;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[13px] font-medium">{c.country}</span>
        <span className="font-mono text-[11.5px]" style={{ color: "var(--ink-muted)" }}>
          {c.total}
        </span>
      </div>
      <div className="flex h-3 w-full overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
        {c.granted > 0 && (
          <div style={{ width: seg(c.granted), background: RESULT_COLORS.granted }} title={`Granted: ${c.granted}`} />
        )}
        {c.inProgress > 0 && (
          <div style={{ width: seg(c.inProgress), background: RESULT_COLORS.inProgress }} title={`In progress: ${c.inProgress}`} />
        )}
        {c.rejected > 0 && (
          <div style={{ width: seg(c.rejected), background: RESULT_COLORS.rejected }} title={`Rejected: ${c.rejected}`} />
        )}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-3 text-[11px]" style={{ color: "var(--ink-muted)" }}>
      <LegendDot color={RESULT_COLORS.granted} label="Granted" />
      <LegendDot color={RESULT_COLORS.inProgress} label="In progress" />
      <LegendDot color={RESULT_COLORS.rejected} label="Rejected" />
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} /> {label}
    </span>
  );
}
