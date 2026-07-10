import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/");

  const { error } = await searchParams;
  const denied = error === "AccessDenied";

  return (
    <div className="grid min-h-screen place-items-center px-4" style={{ background: "var(--canvas)" }}>
      <div className="card w-full max-w-[380px] p-8 text-center">
        <span
          className="mx-auto grid h-11 w-11 place-items-center rounded-[12px] text-[20px] font-bold tracking-[-0.03em]"
          style={{ background: "var(--btn)", color: "var(--btn-ink)" }}
        >
          M
        </span>
        <h1 className="mt-4 text-[19px] font-semibold tracking-[-0.02em]">Master Dashboard</h1>
        <p className="mt-1.5 text-[13.5px]" style={{ color: "var(--ink-muted)" }}>
          Sign in with your Cuemath account to continue.
        </p>

        {denied && (
          <p
            className="mt-5 rounded-[9px] px-3 py-2.5 text-[12.5px] leading-relaxed"
            style={{ background: "var(--health-red-soft)", color: "var(--health-red-text)" }}
          >
            That account isn&apos;t allowed. Only approved Cuemath accounts can access this dashboard.
          </p>
        )}

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
          className="mt-6"
        >
          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-[10px] text-[14px] font-semibold transition-opacity hover:opacity-90"
            style={{ background: "var(--btn)", color: "var(--btn-ink)", boxShadow: "var(--shadow)" }}
          >
            <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden>
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.34A9 9 0 0 0 9 18Z" />
              <path fill="#FBBC05" d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.02-2.34Z" />
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.02 2.34C4.68 5.16 6.66 3.58 9 3.58Z" />
            </svg>
            Continue with Google
          </button>
        </form>

        <p className="mt-5 text-[11.5px]" style={{ color: "var(--ink-muted)" }}>
          Access is limited to authorized team members.
        </p>
      </div>
    </div>
  );
}
