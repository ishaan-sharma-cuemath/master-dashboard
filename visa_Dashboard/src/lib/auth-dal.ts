import { redirect } from "next/navigation";
import { auth, isAllowed } from "@/auth";

/**
 * Data-access-layer guard. Call at the top of every protected page, layout,
 * and Server Action — not just the layout, since layouts don't re-render on
 * soft navigation and Server Actions are separate entry points.
 * Redirects to /signin when there is no allowed session.
 */
export async function requireUser() {
  const session = await auth();
  const email = session?.user?.email;
  if (!isAllowed(email)) redirect("/signin");
  return session!.user!;
}
