export { auth as middleware } from "@/auth";

// Protect everything except API routes (they self-guard), the login page, and static assets.
export const config = {
  matcher: ["/((?!api|login|_next/static|_next/image|favicon.ico).*)"],
};
