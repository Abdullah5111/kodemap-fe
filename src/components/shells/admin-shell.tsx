"use client";

import { useAuth } from "@/components/auth-provider";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { NavItem } from "./nav-item";
import {
  IconDashboard,
  IconQuestions,
  IconTests,
  IconRoadmap,
  IconUsers,
  IconBatches,
  IconList,
  IconReports,
  IconSearch,
  IconLogout,
} from "@/components/ui/icons";

function SideCap({ children }: { children: React.ReactNode }) {
  return (
    <span className="hidden px-2.5 pb-1.5 pt-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-tan md:block">
      {children}
    </span>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="flex min-h-dvh flex-col bg-raise md:h-dvh md:min-h-0 md:overflow-hidden">
      {/* top bar */}
      <header className="flex shrink-0 items-center gap-3 border-b border-line bg-surface px-4 py-3">
        <Logo />
        <div className="flex-1" />
        <div className="hidden items-center gap-2 overflow-hidden whitespace-nowrap rounded-[9px] border border-line bg-ground px-3 py-2 font-mono text-[13px] text-ink-mute sm:flex sm:w-[320px]">
          <IconSearch className="size-[15px] shrink-0" />
          <span className="truncate">Search questions, users, submissions…</span>
        </div>
        <ThemeToggle />
        <Avatar name={user.full_name || user.username} src={user.avatar} />
      </header>

      <div className="grid flex-1 md:min-h-0 md:grid-cols-[220px_1fr] md:overflow-hidden">
        {/* grouped sidebar */}
        <aside className="flex flex-row flex-wrap gap-1 border-b border-line bg-surface p-3 md:flex-col md:border-r md:border-b-0 md:h-full md:overflow-y-auto">
          <SideCap>Overview</SideCap>
          <NavItem href="/admin" label="Dashboard" icon={<IconDashboard />} exact />
          <SideCap>Content</SideCap>
          <NavItem href="/admin/questions" label="Questions" icon={<IconQuestions />} />
          <NavItem href="/admin/exercises" label="Exercises" icon={<IconList />} />
          <NavItem href="/admin/testcases" label="Test cases" icon={<IconTests />} />
          <NavItem href="/admin/roadmap" label="Tracks & roadmap" icon={<IconRoadmap />} />
          <SideCap>People</SideCap>
          <NavItem href="/admin/users" label="Users" icon={<IconUsers />} />
          <NavItem href="/admin/batches" label="Batches" icon={<IconBatches />} />
          <SideCap>Activity</SideCap>
          <NavItem href="/admin/submissions" label="Submissions" icon={<IconList />} />
          <NavItem href="/admin/reports" label="Reports" icon={<IconReports />} />
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
        <main className="min-w-0 p-4 sm:p-5 md:h-full md:overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
