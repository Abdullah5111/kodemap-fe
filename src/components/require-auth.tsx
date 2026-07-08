"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";
import { homePathForRole, type Role } from "@/lib/types";
import { LogoMark } from "./ui/logo";

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <div className="flex animate-pulse flex-col items-center gap-3 text-ink-mute">
        <LogoMark className="size-11" />
        <span className="font-mono text-sm">Loading…</span>
      </div>
    </div>
  );
}

/** Gate a subtree behind auth + role. Redirects unauthenticated users to /login
    and wrong-role users to their own home. */
export function RequireAuth({
  roles,
  children,
}: {
  roles: Role[];
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else if (!roles.includes(user.role)) {
      router.replace(homePathForRole(user.role));
    }
  }, [user, loading, roles, router]);

  if (loading || !user || !roles.includes(user.role)) return <Splash />;
  return <>{children}</>;
}
