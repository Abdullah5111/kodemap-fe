import { RequireAuth } from "@/components/require-auth";
import { LearnerShell } from "@/components/shells/learner-shell";

export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth roles={["learner"]}>
      <LearnerShell>{children}</LearnerShell>
    </RequireAuth>
  );
}
