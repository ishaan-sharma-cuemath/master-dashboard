import { AppShell } from "@/components/shell/AppShell";
import { requireUser } from "@/lib/auth-dal";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <AppShell userEmail={user.email ?? ""}>{children}</AppShell>;
}
