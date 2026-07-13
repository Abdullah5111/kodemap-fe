"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { statsApi, type LeaderboardEntry } from "@/lib/stats";
import { apiErrorMessage } from "@/lib/api";
import { Avatar } from "@/components/ui/avatar";
import { Loading, ErrorState, EmptyState } from "@/components/ui/feedback";
import { IconFlame } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

function Row({ e }: { e: LeaderboardEntry }) {
  return (
    <tr className={cn("border-b border-line last:border-b-0", e.is_me && "bg-ember-soft")}>
      <td className={cn("px-4 py-3", e.is_me && "shadow-[inset_3px_0_0_var(--ember)]")}>
        <span
          className={cn(
            "font-mono font-bold tabular-nums",
            e.rank <= 3 ? "text-ember" : "text-ink-mute",
          )}
        >
          {e.rank}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={e.full_name || e.username} className="size-8" />
          <div>
            <b className="text-[14px] font-semibold">
              {e.username}
              {e.is_me ? <span className="text-ink-mute"> · you</span> : null}
            </b>
            <div className="text-[12px] text-ink-mute">{e.institution || "—"}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-right font-mono tabular-nums">{e.score.toLocaleString()}</td>
      <td className="px-4 py-3 text-right font-mono tabular-nums">{e.solved}</td>
      <td className="px-4 py-3 text-right">
        <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-ember">
          <IconFlame className="size-[14px]" />
          {e.streak}
        </span>
      </td>
    </tr>
  );
}

const TABS = [
  { key: "global", label: "Global", enabled: true },
  { key: "batch", label: "My Batch", enabled: false },
  { key: "weekly", label: "This Week", enabled: false },
];

export default function LeaderboardPage() {
  const [tab, setTab] = useState("global");
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: statsApi.leaderboard,
  });

  const results = data?.results ?? [];
  const me = data?.me;
  const meShown = me && results.some((r) => r.is_me);

  return (
    <div>
      <h1 className="text-[clamp(21px,3vw,27px)] font-bold tracking-tight">Leaderboard</h1>
      <p className="mt-2 max-w-[60ch] text-sm text-ink-dim">
        Points come from first-accepted solutions; ties break on who reached the score first.
        Keep a daily streak going to stay warm.
      </p>

      <div className="mt-5 flex gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            disabled={!t.enabled}
            onClick={() => t.enabled && setTab(t.key)}
            className={cn(
              "rounded-[9px] border px-3.5 py-2 text-[13px] font-medium transition-colors",
              tab === t.key
                ? "border-ember-line bg-ember-soft text-ember"
                : "border-line bg-surface text-ink-dim hover:text-ink",
              !t.enabled && "cursor-not-allowed opacity-45 hover:text-ink-dim",
            )}
            title={t.enabled ? undefined : "Coming soon"}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {isLoading ? (
          <Loading label="Loading leaderboard…" />
        ) : error ? (
          <ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} />
        ) : results.length === 0 ? (
          <EmptyState title="No ranked learners yet" description="Solve a question to get on the board." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line text-left font-mono text-[10.5px] uppercase tracking-wider text-ink-mute">
                  <th className="px-4 py-2.5 font-semibold">#</th>
                  <th className="px-4 py-2.5 font-semibold">Learner</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Score</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Solved</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Streak</th>
                </tr>
              </thead>
              <tbody>
                {results.map((e) => (
                  <Row key={e.user_id} e={e} />
                ))}
                {me && !meShown ? (
                  <>
                    <tr>
                      <td colSpan={5} className="px-4 py-1 text-center font-mono text-[11px] text-ink-mute">
                        ···
                      </td>
                    </tr>
                    <Row e={me} />
                  </>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
