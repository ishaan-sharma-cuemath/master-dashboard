import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

export const dynamic = "force-dynamic";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await auth();
  if (session?.user) redirect("/");
  const { error } = await searchParams;

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="card w-full max-w-[380px] p-7 text-center">
        <div
          className="mx-auto grid h-11 w-11 place-items-center rounded-[11px] text-[17px] font-bold"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          V
        </div>
        <h1 className="mt-4 text-[19px] font-semibold tracking-[-0.01em]">Visa Tracker</h1>
        <p className="mt-1 text-[13px]" style={{ color: "var(--ink-muted)" }}>
          Sign in with your Cuemath Google account.
        </p>

        {error && (
          <p
            className="mt-4 rounded-[9px] px-3 py-2 text-[12.5px]"
            style={{ background: "var(--health-red-soft)", color: "var(--health-red-text)" }}
          >
            {error === "AccessDenied"
              ? "This account isn't on the access list. Ask an admin to add you."
              : "Sign-in failed. Please try again."}
          </p>
        )}

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
          className="mt-5"
        >
          <button type="submit" className="btn btn-ghost w-full justify-center">
            <GoogleG /> Continue with Google
          </button>
        </form>
      </div>
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7A21.99 21.99 0 0 0 24 46z"
      />
      <path fill="#FBBC05" d="M11.69 28.18A13.2 13.2 0 0 1 11 24c0-1.45.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z" />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.94 4.34 14.12l7.35 5.7C13.42 14.62 18.27 10.75 24 10.75z"
      />
    </svg>
  );
}
