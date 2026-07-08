"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { homePathForRole } from "@/lib/types";
import { LogoMark } from "@/components/ui/logo";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? homePathForRole(user.role) : "/login");
  }, [user, loading, router]);

  return (
    <main className="grid min-h-dvh place-items-center">
      <div className="flex animate-pulse flex-col items-center gap-3 text-ink-mute">
        <LogoMark className="size-11" />
        <span className="font-mono text-sm">Loading Kodemap…</span>
      </div>
    </main>
  );
}
