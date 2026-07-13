import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/** Only these accounts may sign in. Compared case-insensitively. */
export const ALLOWED_EMAILS = [
  "akash.sharma@cuemath.com",
  "ishaan.sharma@cuemath.com",
  "ravindra.rajput@cuemath.com",
];

export function isAllowed(email: string | null | undefined): boolean {
  return !!email && ALLOWED_EMAILS.includes(email.toLowerCase());
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  callbacks: {
    // Gate #1: block non-allowlisted Google accounts from ever getting a session.
    signIn({ user, profile }) {
      return isAllowed(profile?.email ?? user?.email);
    },
  },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
});
