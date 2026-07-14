"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { adminApi, ROLE_META, type AdminOverview } from "@/lib/admin";
import { STATUS_META, type SubmissionStatus } from "@/lib/solve";
import { DIFFICULTY_META } from "@/lib/content";
import { timeAgo } from "@/lib/stats";
import { apiErrorMessage } from "@/lib/api";
import { Avatar } from "@/components/ui/avatar";
import { Loading, ErrorState } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";

// Only verdicts worth charting, in a sensible order.
const VERDICT_ORDER: SubmissionStatus[] = [
  "accepted",
  "wrong_answer",
  "time_limit_exceeded",
  "runtime_error",
  "compilation_error",
];
const TONE_VAR: Record<string, string> = {
  ok: "var(--ok)",
  bad: "var(--bad)",
  warn: "var(--warn)",
  run: "var(--tan)",
};

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-mute">{label}</div>
      <div className="mt-1.5 text-[26px] font-bold tabular-nums">{value}</div>
      {sub ? <div className="font-mono text-[11.5px] text-ink-mute">{sub}</div> : null}
    </div>
  );
}

function ActivityChart({ data }: { data: AdminOverview["activity"] }) {
  const max = Math.max(1, ...data.map((d) => d.submissions));
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold">Submissions · last 14 days</h2>
        <div className="flex items-center gap-3 font-mono text-[11px] text-ink-mute">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px] bg-ember" /> Accepted
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px] bg-line-2" /> Other
          </span>
        </div>
      </div>
      <div className="mt-4 flex h-[140px] items-end gap-[3px]">
        {data.map((d) => {
          const others = d.submissions - d.accepted;
          return (
            <div key={d.date} className="group relative flex flex-1 flex-col justify-end gap-[2px]">
              <div
                className="w-full rounded-t-[3px] bg-line-2"
                style={{ height: `${(others / max) * 116}px` }}
              />
              <div
                className="w-full rounded-b-[3px] bg-ember first:rounded-t-[3px]"
                style={{ height: `${(d.accepted / max) * 116}px` }}
              />
              {/* tooltip */}
              <div className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-line bg-elevated px-2 py-1 font-mono text-[10.5px] text-ink shadow-sm group-hover:block">
                {d.date.slice(5)} · {d.accepted}/{d.submissions} ok
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VerdictBars({ verdicts }: { verdicts: AdminOverview["verdicts"] }) {
  const rows = VERDICT_ORDER.map((s) => ({ status: s, count: verdicts[s] ?? 0 }));
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="text-[15px] font-bold">Verdict mix</h2>
      <p className="font-mono text-[11.5px] text-ink-mute">{total} graded submissions</p>
      <div className="mt-3 flex flex-col gap-2.5">
        {rows.map((r) => {
          const meta = STATUS_META[r.status];
          const pct = total ? Math.round((r.count / total) * 100) : 0;
          return (
            <div key={r.status} className="flex items-center gap-3">
              <span className="w-28 truncate font-mono text-[12px]" style={{ color: TONE_VAR[meta.tone] }}>
                {meta.label}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-elevated">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: TONE_VAR[meta.tone] }}
                />
              </div>
              <span className="w-16 text-right font-mono text-[12px] tabular-nums text-ink-dim">
                {r.count} · {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: adminApi.overview,
  });

  return (
    <div>
      <p className="font-mono text-[12px] text-ink-mute">admin / overview</p>
      <h1 className="mt-1 text-[clamp(20px,3vw,25px)] font-bold tracking-tight">Platform overview</h1>

      {isLoading ? (
        <Loading label="Loading platform stats…" />
      ) : error ? (
        <div className="mt-5">
          <ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} />
        </div>
      ) : !data ? null : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi
              label="Users"
              value={data.totals.users.toLocaleString()}
              sub={`${data.totals.learners} learners · ${data.totals.staff} staff`}
            />
            <Kpi
              label="Questions"
              value={data.totals.questions.toLocaleString()}
              sub={`${data.totals.active_questions} live`}
            />
            <Kpi label="Submissions" value={data.totals.submissions.toLocaleString()} sub="all time" />
            <Kpi label="Problems solved" value={data.totals.solved_total.toLocaleString()} sub="unique learner · question" />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <ActivityChart data={data.activity} />
            <VerdictBars verdicts={data.verdicts} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {/* most attempted */}
            <div className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="text-[15px] font-bold">Most attempted questions</h2>
              {data.top_questions.length === 0 ? (
                <p className="mt-3 font-mono text-[12.5px] text-ink-mute">No submissions yet.</p>
              ) : (
                <div className="mt-3 flex flex-col">
                  {data.top_questions.map((q) => (
                    <Link
                      key={q.id}
                      href={`/admin/questions/${q.id}/edit`}
                      className="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0 hover:text-ember"
                    >
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ background: `var(--d-${diffVar(q.difficulty)})` }}
                      />
                      <span className="flex-1 truncate text-[13.5px]">{q.title}</span>
                      <span className="font-mono text-[11.5px] text-ok">{q.solved} solved</span>
                      <span className="w-20 text-right font-mono text-[11.5px] text-ink-mute tabular-nums">
                        {q.attempts} tries
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* recent signups */}
            <div className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-bold">Recent signups</h2>
                <Link href="/admin/users" className="font-mono text-[11.5px] text-ink-mute hover:text-ember">
                  all users →
                </Link>
              </div>
              <div className="mt-3 flex flex-col">
                {data.recent_signups.map((u) => (
                  <Link
                    key={u.id}
                    href={`/admin/users?focus=${u.id}`}
                    className="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0 hover:bg-ground"
                  >
                    <Avatar name={u.full_name || u.username} className="size-8" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-medium">{u.full_name || u.username}</div>
                      <div className="truncate font-mono text-[11px] text-ink-mute">
                        {u.institution || "—"}
                      </div>
                    </div>
                    <span className={cn("rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold", ROLE_META[u.role].cls)}>
                      {ROLE_META[u.role].label}
                    </span>
                    <span className="w-14 text-right font-mono text-[10.5px] text-ink-mute">
                      {timeAgo(u.date_joined)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function diffVar(d: keyof typeof DIFFICULTY_META): string {
  return { very_easy: "vezy", easy: "easy", medium: "med", hard: "hard", challenge: "chal" }[d];
}
