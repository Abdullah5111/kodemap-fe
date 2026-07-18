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
    <span className="hidden px-2.5 pb-1.5 pt-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-mute md:block">
      {children}
    </span>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  if (!user) return null;

  const roleLabel = user.role === "supervisor" ? "Supervisor" : "Administrator";

  return (
    <div className="flex min-h-dvh flex-col bg-raise">
      {/* top bar */}
      <header className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3">
        <Logo chip="admin" />
        <div className="ml-2 hidden items-center gap-2 rounded-[9px] border border-line bg-ground px-3 py-2 font-mono text-[13px] text-ink-mute sm:flex sm:w-[320px]">
          <IconSearch className="size-[15px]" />
          Search questions, users, submissions…
        </div>
        <div className="flex-1" />
        <span className="rounded-full border border-line bg-tan-soft px-2.5 py-1 font-mono text-[11px] font-semibold text-tan">
          {roleLabel}
        </span>
        <ThemeToggle />
        <Avatar name={user.full_name || user.username} />
      </header>

      <div className="grid flex-1 md:grid-cols-[220px_1fr]">
        {/* grouped sidebar */}
        <aside className="flex flex-row flex-wrap gap-1 border-b border-line bg-surface p-3 md:flex-col md:border-r md:border-b-0">
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
            className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium text-ink-dim transition-colors hover:bg-ground hover:text-ink"
          >
            <IconLogout className="size-[17px]" />
            <span className="hidden md:inline">Sign out</span>
          </button>
        </aside>

        {/* content */}
        <main className="min-w-0 p-4 sm:p-5">{children}</main>
      </div>
    </div>
  );
}
