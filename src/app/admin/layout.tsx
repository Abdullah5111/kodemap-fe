import { RequireAuth } from "@/components/require-auth";
import { AdminShell } from "@/components/shells/admin-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth roles={["admin", "supervisor"]}>
      <AdminShell>{children}</AdminShell>
    </RequireAuth>
  );
}
