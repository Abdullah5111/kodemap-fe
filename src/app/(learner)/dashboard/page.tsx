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
import { IconFlame } from "@/components/ui/icons";

function StatTile({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string;
  accent?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-mute">{label}</div>
      <div className="mt-1.5 flex items-center gap-2">
        <span className={`text-[26px] font-bold tabular-nums ${accent ? "text-ember" : ""}`}>
          {value}
        </span>
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
      <p className="font-mono text-[12px] text-ink-mute">learn / dashboard</p>
      <h1 className="mt-1 text-[clamp(21px,3vw,27px)] font-bold tracking-tight">
        Welcome back{user ? `, ${user.username}` : ""}
      </h1>

      {isLoading ? (
        <Loading label="Loading your stats…" />
      ) : error ? (
        <div className="mt-5">
          <ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} />
        </div>
      ) : !data ? null : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Score" value={data.score.toLocaleString()} accent />
            <StatTile label="Solved" value={String(data.solved)} />
            <StatTile label="Rank" value={data.rank ? `#${data.rank}` : "—"} />
            <StatTile
              label="Streak"
              value={String(data.streak)}
              icon={<IconFlame className="size-5 text-ember" />}
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
            {/* solved by difficulty */}
            <div className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="text-[15px] font-bold">Solved by difficulty</h2>
              <div className="mt-3 flex flex-col gap-2.5">
                {DIFFICULTY_ORDER.map((d) => {
                  const count = data.by_difficulty[d] ?? 0;
                  const meta = DIFFICULTY_META[d];
                  return (
                    <div key={d} className="flex items-center gap-3">
                      <span className="w-24 font-mono text-[12px]" style={{ color: `var(--d-${D_VAR[d]})` }}>
                        {meta.label}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-elevated">
                        <div
                          className="h-full rounded-full"
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
              <div className="mt-4 border-t border-line pt-3 font-mono text-[12px] text-ink-mute">
                {data.accepted_count} accepted · {data.submissions_total} submissions ·{" "}
                {data.attempted} attempted
              </div>
            </div>

            {/* recent submissions */}
            <div className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="text-[15px] font-bold">Recent activity</h2>
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
                      className="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0 hover:text-ember"
                    >
                      <span className="flex-1 truncate text-[13.5px]">{s.question_title}</span>
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

          <div className="mt-4 flex items-center justify-between rounded-2xl border border-line border-l-[3px] border-l-ember bg-surface px-5 py-4">
            <div>
              <p className="text-[14px] font-semibold">Keep the streak alive</p>
              <p className="text-[13px] text-ink-dim">Solve today&apos;s next must-do question.</p>
            </div>
            <Link href="/roadmap">
              <Button size="sm">Continue roadmap</Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
