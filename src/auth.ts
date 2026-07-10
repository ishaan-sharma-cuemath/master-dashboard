import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/** Only these accounts may sign in. Add/remove emails here. */
export const ALLOWED_EMAILS = ["akash.sharma@cuemath.com", "ishaan.sharma@cuemath.com"];

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [Google],
  pages: { signIn: "/login" },
  callbacks: {
    /** Gate at sign-in: reject anyone not on the allowlist. */
    signIn({ profile, user }) {
      const email = (profile?.email ?? user?.email ?? "").toLowerCase();
      return ALLOWED_EMAILS.includes(email);
    },
    /** Used by middleware to protect every page. */
    authorized({ auth }) {
      return Boolean(auth?.user);
    },
  },
});
