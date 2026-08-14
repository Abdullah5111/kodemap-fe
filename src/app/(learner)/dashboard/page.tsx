"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { statsApi, timeAgo, type MyStats } from "@/lib/stats";
import { DIFFICULTY_META, DIFFICULTY_ORDER, type Difficulty } from "@/lib/content";

const D_VAR: Record<Difficulty, string> = {
  very_easy: "vezy",
  easy: "easy",
  medium: "med",
  hard: "hard",
  challenge: "chal",
};
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/badge";
import { Loading, ErrorState, EmptyState } from "@/components/ui/feedback";
import { LogoMark } from "@/components/ui/logo";
import { SectionTitle } from "@/components/ui/page-header";
import { IconFlame } from "@/components/ui/icons";

function StatTile({
  label,
  value,
  hero,
  icon,
}: {
  label: string;
  value: string;
  hero?: boolean;
  icon?: React.ReactNode;
}) {
  if (hero) {
    return (
      <div className="bg-brand-grad brand-glow-sm relative overflow-hidden rounded-2xl p-4 text-white">
        <div className="font-mono text-[10.5px] uppercase tracking-wider text-white/70">{label}</div>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-[30px] font-extrabold tabular-nums drop-shadow-sm">{value}</span>
          {icon}
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-0.5 hover:border-line-2 hover:shadow-[var(--shadow)]">
      <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-mute">{label}</div>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="text-[30px] font-extrabold tabular-nums">{value}</span>
        {icon}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useQuery<MyStats>({
    queryKey: ["my-stats"],
    queryFn: statsApi.myStats,
  });

  return (
    <div>
      {/* hero */}
      <div className="relative overflow-hidden rounded-3xl border border-line bg-surface px-6 py-7 sm:px-8 sm:py-8">
        <div className="bg-brand-aura pointer-events-none absolute inset-0" aria-hidden />
        <LogoMark
          className="pointer-events-none absolute -right-6 -top-6 size-40 opacity-[0.06] blur-[1px]"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ember">
              Learn / Dashboard
            </p>
            <h1 className="mt-2 text-[clamp(26px,4vw,38px)] font-extrabold leading-[1.05] tracking-tight">
              Welcome back{user ? <>, <span className="text-brand-grad">{user.username}</span></> : ""}
            </h1>
            <p className="mt-2 max-w-[46ch] text-[14px] text-ink-dim">
              Keep building momentum — every solved problem moves you up the map.
            </p>
          </div>
          {user ? (
            <span className="bg-brand-grad brand-glow-sm inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[15px] font-bold text-white">
              <IconFlame className="size-[18px]" />
              {user.streak_count}
              <span className="text-[11px] font-medium text-white/70">day streak</span>
            </span>
          ) : null}
        </div>
      </div>

      {isLoading ? (
        <Loading label="Loading your stats…" />
      ) : error ? (
        <div className="mt-5">
          <ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} />
        </div>
      ) : !data ? null : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Score" value={data.score.toLocaleString()} hero />
            <StatTile label="Solved" value={String(data.solved)} />
            <StatTile label="Rank" value={data.rank ? `#${data.rank}` : "—"} />
            <StatTile
              label="Streak"
              value={String(data.streak)}
              icon={<IconFlame className="size-6 text-ember" />}
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
            {/* solved by difficulty */}
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow)] sm:p-6">
              <SectionTitle>Solved by difficulty</SectionTitle>
              <div className="mt-4 flex flex-col gap-3">
                {DIFFICULTY_ORDER.map((d) => {
                  const count = data.by_difficulty[d] ?? 0;
                  const meta = DIFFICULTY_META[d];
                  return (
                    <div key={d} className="flex items-center gap-3">
                      <span className="w-24 font-mono text-[12px]" style={{ color: `var(--d-${D_VAR[d]})` }}>
                        {meta.label}
                      </span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-elevated">
                        <div
                          className="h-full rounded-full transition-[width] duration-500"
                          style={{
                            width: `${Math.min(100, count * 20)}%`,
                            background: `var(--d-${D_VAR[d]})`,
                          }}
                        />
                      </div>
                      <span className="w-6 text-right font-mono text-[13px] tabular-nums text-ink-dim">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 border-t border-line pt-3 font-mono text-[12px] text-ink-mute">
                {data.accepted_count} accepted · {data.submissions_total} submissions ·{" "}
                {data.attempted} attempted
              </div>
            </div>

            {/* recent submissions */}
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow)] sm:p-6">
              <SectionTitle>Recent activity</SectionTitle>
              {data.recent_submissions.length === 0 ? (
                <div className="mt-3">
                  <EmptyState
                    title="No submissions yet"
                    description="Head to the roadmap and solve your first question."
                    action={
                      <Link href="/roadmap">
                        <Button size="sm">Go to roadmap</Button>
                      </Link>
                    }
                  />
                </div>
              ) : (
                <div className="mt-3 flex flex-col">
                  {data.recent_submissions.map((s) => (
                    <Link
                      key={s.id}
                      href={`/questions/${s.question_slug}`}
                      className="group flex items-center gap-3 border-b border-line py-2.5 last:border-b-0"
                    >
                      <span className="flex-1 truncate text-[13.5px] transition-colors group-hover:text-ember">
                        {s.question_title}
                      </span>
                      <span className="font-mono text-[11px] text-ink-mute">{s.mode}</span>
                      <StatusPill status={s.status} />
                      <span className="w-16 text-right font-mono text-[11px] text-ink-mute">
                        {timeAgo(s.created_at)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CTA banner */}
          <div className="bg-brand-grad brand-glow relative mt-4 flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-2xl px-6 py-5 text-white sm:px-7">
            <LogoMark
              className="pointer-events-none absolute -right-4 -bottom-8 size-36 opacity-10"
              variant="white"
              aria-hidden
            />
            <div className="relative">
              <p className="text-[16px] font-bold">Keep the streak alive</p>
              <p className="text-[13.5px] text-white/80">Solve today&apos;s next must-do question.</p>
            </div>
            <Link href="/roadmap" className="relative">
              <span className="inline-flex items-center justify-center rounded-[10px] bg-white px-4 py-2.5 text-sm font-bold text-[#722525] transition-transform hover:-translate-y-px">
                Continue roadmap
              </span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
