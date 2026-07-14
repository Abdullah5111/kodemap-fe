"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  adminApi,
  type ReportName,
  type ReportResponse,
  type LearnerReportRow,
  type QuestionReportRow,
} from "@/lib/admin";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { DifficultyBadge } from "@/components/ui/badge";
import { Loading, ErrorState, EmptyState } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";

const TABS: { key: ReportName; label: string; blurb: string }[] = [
  {
    key: "learners",
    label: "Learner progress",
    blurb: "Score, completion, accuracy and streak for every learner you oversee.",
  },
  {
    key: "questions",
    label: "Question difficulty",
    blurb: "Which questions people get stuck on — low solve rate means it's too hard.",
  },
];

/** A slim bar used inline in table cells to make a percentage scannable. */
function Meter({ pct, tone = "ember" }: { pct: number; tone?: "ember" | "ok" | "bad" }) {
  const color = tone === "ok" ? "var(--ok)" : tone === "bad" ? "var(--bad)" : "var(--ember)";
  return (
    <div className="flex items-center justify-end gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-elevated">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-11 text-right font-mono text-[12px] tabular-nums">{pct}%</span>
    </div>
  );
}

export default function AdminReportsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<ReportName>("learners");
  const [batch, setBatch] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [dlError, setDlError] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-report", tab, batch],
    queryFn: () => adminApi.report<LearnerReportRow | QuestionReportRow>(tab, batch || undefined),
  });

  const active = TABS.find((t) => t.key === tab)!;

  async function download() {
    setDlError(null);
    setDownloading(true);
    try {
      await adminApi.downloadReport(tab, batch || undefined);
    } catch (e) {
      setDlError(apiErrorMessage(e, "Couldn't export the CSV."));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div>
      <p className="font-mono text-[12px] text-ink-mute">admin / activity / reports</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[clamp(20px,3vw,25px)] font-bold tracking-tight">Reports</h1>
        <Button size="sm" onClick={download} disabled={downloading || !data?.count}>
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v12M7 11l5 5 5-5M4 21h16" />
          </svg>
          {downloading ? "Exporting…" : "Export CSV"}
        </Button>
      </div>
      <p className="mt-2 max-w-[64ch] text-sm text-ink-dim">
        {active.blurb}
        {user?.role === "supervisor" ? " You see only the batches you supervise." : ""}
      </p>

      {/* tabs + batch filter */}
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <div className="flex gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "rounded-[9px] border px-3.5 py-2 text-[13px] font-medium transition-colors",
                tab === t.key
                  ? "border-ember-line bg-ember-soft text-ember"
                  : "border-line bg-surface text-ink-dim hover:text-ink",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Select value={batch} onChange={(e) => setBatch(e.target.value)} className="ml-auto w-auto">
          <option value="">All batches</option>
          <option value="none">No batch</option>
          {(data?.batches ?? []).map((b) => (
            <option key={b.id} value={String(b.id)}>{b.name}</option>
          ))}
        </Select>
      </div>

      {dlError ? <p className="mt-3 font-mono text-[12.5px] text-bad">{dlError}</p> : null}

      <div className="mt-4">
        {isLoading ? (
          <Loading label="Building report…" />
        ) : error ? (
          <ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} />
        ) : !data || data.count === 0 ? (
          <EmptyState
            title="Nothing to report yet"
            description={
              tab === "learners"
                ? "No learners match this filter."
                : "No questions have been attempted yet."
            }
          />
        ) : tab === "learners" ? (
          <LearnersTable rows={data.results as LearnerReportRow[]} />
        ) : (
          <QuestionsTable rows={data.results as QuestionReportRow[]} />
        )}

        {data?.count ? (
          <p className="mt-3 font-mono text-[11.5px] text-ink-mute">
            {data.count} {data.count === 1 ? "row" : "rows"}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function LearnersTable({ rows }: { rows: LearnerReportRow[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-wider text-ink-mute">
            <th className="px-3 py-2.5 font-semibold">Learner</th>
            <th className="px-3 py-2.5 font-semibold">Batch</th>
            <th className="px-3 py-2.5 text-right font-semibold">Score</th>
            <th className="px-3 py-2.5 text-right font-semibold">Solved</th>
            <th className="px-3 py-2.5 text-right font-semibold">Completion</th>
            <th className="px-3 py-2.5 text-right font-semibold">Accuracy</th>
            <th className="px-3 py-2.5 text-right font-semibold">Streak</th>
            <th className="px-3 py-2.5 text-right font-semibold">Last active</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.user_id} className="border-b border-line last:border-b-0 hover:bg-ground">
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <Avatar name={r.full_name || r.username} className="size-7 text-[10px]" />
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px]">{r.full_name || r.username}</div>
                    <div className="truncate font-mono text-[10.5px] text-ink-mute">{r.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-3 py-2.5 font-mono text-[11.5px] text-ink-mute">{r.batch || "—"}</td>
              <td className="px-3 py-2.5 text-right font-mono text-[13px] tabular-nums text-ember">{r.score}</td>
              <td className="px-3 py-2.5 text-right font-mono text-[13px] tabular-nums">
                {r.solved}
                <span className="text-ink-mute">/{r.attempted}</span>
              </td>
              <td className="px-3 py-2.5"><Meter pct={r.completion} /></td>
              <td className="px-3 py-2.5">
                <Meter pct={r.accuracy} tone={r.accuracy >= 50 ? "ok" : "bad"} />
              </td>
              <td className="px-3 py-2.5 text-right font-mono text-[12px] tabular-nums">{r.streak}</td>
              <td className="px-3 py-2.5 text-right font-mono text-[11px] text-ink-mute">
                {r.last_active || "never"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QuestionsTable({ rows }: { rows: QuestionReportRow[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-wider text-ink-mute">
            <th className="px-3 py-2.5 font-semibold">Question</th>
            <th className="px-3 py-2.5 font-semibold">Difficulty</th>
            <th className="px-3 py-2.5 text-right font-semibold">Tried by</th>
            <th className="px-3 py-2.5 text-right font-semibold">Solvers</th>
            <th className="px-3 py-2.5 text-right font-semibold">Solve rate</th>
            <th className="px-3 py-2.5 text-right font-semibold">Avg tries</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.question_id} className="border-b border-line last:border-b-0 hover:bg-ground">
              <td className="px-3 py-2.5 text-[13.5px]">{r.title}</td>
              <td className="px-3 py-2.5">
                <DifficultyBadge difficulty={r.difficulty} showScore={false} />
              </td>
              <td className="px-3 py-2.5 text-right font-mono text-[13px] tabular-nums">{r.attempters}</td>
              <td className="px-3 py-2.5 text-right font-mono text-[13px] tabular-nums text-ok">{r.solvers}</td>
              <td className="px-3 py-2.5">
                {/* low solve rate = the question is a wall */}
                <Meter pct={r.solve_rate} tone={r.solve_rate >= 50 ? "ok" : "bad"} />
              </td>
              <td className="px-3 py-2.5 text-right font-mono text-[12px] tabular-nums text-ink-dim">
                {r.avg_attempts || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
