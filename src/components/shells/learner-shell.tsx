"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
import { orgApi } from "@/lib/orgs";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { NavItem } from "./nav-item";
import {
  IconDashboard,
  IconRoadmap,
  IconTrophy,
  IconUser,
  IconUsers,
  IconFlame,
  IconList,
  IconLogout,
} from "@/components/ui/icons";

export function LearnerShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { data: inviteCount } = useQuery({
    queryKey: ["my-invitations-count"],
    queryFn: orgApi.myInvitationsCount,
    enabled: !!user,
    refetchInterval: 60_000,
  });
  if (!user) return null;

  return (
    <div className="flex min-h-dvh flex-col">
      {/* top bar */}
      <header className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3">
        <Logo />
        <div className="flex-1" />
        <span className="bg-brand-grad brand-glow-sm inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[13px] font-semibold text-white">
          <IconFlame className="size-[15px]" />
          {user.streak_count}
        </span>
        <ThemeToggle />
        <Avatar name={user.full_name || user.username} />
      </header>

      <div className="grid flex-1 md:grid-cols-[210px_1fr]">
        {/* sidebar */}
        <aside className="flex flex-row flex-wrap gap-1 border-b border-line bg-surface p-3 md:flex-col md:border-r md:border-b-0">
          <span className="hidden px-2.5 pb-1.5 pt-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-tan md:block">
            Learn
          </span>
          <NavItem href="/dashboard" label="Dashboard" icon={<IconDashboard />} />
          <NavItem href="/roadmap" label="Roadmap" icon={<IconRoadmap />} />
          <NavItem href="/leaderboard" label="Leaderboard" icon={<IconTrophy />} />
          <NavItem href="/organizations" label="Organizations" icon={<IconUsers />} />
          <NavItem
            href="/invitations"
            label="Invitations"
            icon={<IconList />}
            badge={inviteCount}
          />
          <NavItem href="/profile" label="Profile" icon={<IconUser />} />
          <div className="hidden flex-1 md:block" />
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium text-ink-dim transition-colors hover:bg-ground hover:text-ink"
          >
            <IconLogout className="size-[17px]" />
            <span className="hidden md:inline">Sign out</span>
          </button>
        </aside>

        {/* content */}
        <main className="min-w-0 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
