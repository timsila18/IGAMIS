import { AppShellClient } from "@/components/app-shell-client";
import { logoutAction, type SessionUser } from "@/lib/auth";

export function AppShell({ children, user }: { children: React.ReactNode; user: SessionUser }) {
  return <AppShellClient user={user} logoutAction={logoutAction}>{children}</AppShellClient>;
}
