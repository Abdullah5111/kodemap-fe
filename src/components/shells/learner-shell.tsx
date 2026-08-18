"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
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
    refetchOnWindowFocus: true,
  });
  if (!user) return null;

  return (
    <div className="flex min-h-dvh flex-col md:h-dvh md:min-h-0 md:overflow-hidden">
      {/* top bar */}
      <header className="flex shrink-0 items-center gap-3 border-b border-line bg-surface px-4 py-3">
        <Logo />
        <div className="flex-1" />
        <span className="bg-brand-grad brand-glow-sm inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[13px] font-semibold text-white">
          <IconFlame className="size-[15px]" />
          {user.streak_count}
        </span>
        <ThemeToggle />
        <Link
          href="/profile"
          title="Your profile"
          aria-label="Your profile"
          className="rounded-full outline-offset-2 transition-[box-shadow] hover:shadow-[0_0_0_2px_var(--ember-line)]"
        >
          <Avatar name={user.full_name || user.username} src={user.avatar} />
        </Link>
      </header>

      <div className="grid flex-1 md:min-h-0 md:grid-cols-[210px_1fr] md:overflow-hidden">
        {/* sidebar */}
        <aside className="flex flex-row flex-wrap gap-1 border-b border-line bg-surface p-3 md:flex-col md:border-r md:border-b-0 md:h-full md:overflow-y-auto md:pt-4">
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
          <div className="hidden flex-1 md:block" />
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-3 rounded-[10px] border border-line-2 bg-elevated px-3 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-bad hover:bg-bad-soft hover:text-bad"
          >
            <IconLogout className="size-[17px]" />
            <span className="hidden md:inline">Sign out</span>
          </button>
        </aside>

        {/* content */}
        <main className="min-w-0 p-4 sm:p-6 md:h-full md:overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
