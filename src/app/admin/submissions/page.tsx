"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin";
import { STATUS_META, TERMINAL_STATUSES, type SubmissionStatus } from "@/lib/solve";
import { timeAgo } from "@/lib/stats";
import { apiErrorMessage } from "@/lib/api";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Loading, ErrorState, EmptyState } from "@/components/ui/feedback";
import { IconSearch } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

const STATUS_OPTIONS: SubmissionStatus[] = [
  "accepted",
  "wrong_answer",
  "time_limit_exceeded",
  "runtime_error",
  "compilation_error",
  "processing",
];

function toneClass(tone: string): string {
  return tone === "ok"
    ? "text-ok bg-ok-soft"
    : tone === "warn"
      ? "text-warn bg-warn-soft"
      : tone === "run"
        ? "text-tan bg-tan-soft"
        : "text-bad bg-bad-soft";
}

export default function AdminSubmissionsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [mode, setMode] = useState("");

  const params: Record<string, string> = {};
  if (search.trim()) params.search = search.trim();
  if (status) params.status = status;
  if (mode) params.mode = mode;

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-submissions", status, mode, search.trim()],
    queryFn: () => adminApi.submissions(params),
    refetchInterval: 15000, // live-ish monitor
  });

  const rows = data?.results ?? [];

  return (
    <div>
      <p className="font-mono text-[12px] text-ink-mute">admin / activity / submissions</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[clamp(20px,3vw,25px)] font-bold tracking-tight">Submissions monitor</h1>
        <div className="flex items-center gap-2 font-mono text-[12px] text-ink-mute">
          <span className={cn("size-2 rounded-full", isFetching ? "bg-ok" : "bg-line-2")} />
          {data ? `${data.count} total` : "live"}
          <Button variant="ghost" size="sm" onClick={() => refetch()}>Refresh</Button>
        </div>
      </div>

      {/* toolbar */}
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-[9px] border border-line bg-surface px-3 py-2 font-mono text-[13px] text-ink-mute">
          <IconSearch className="size-[15px]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search username or question…"
            className="w-full bg-transparent text-ink outline-none placeholder:text-ink-mute"
          />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto">
          <option value="">All verdicts</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{STATUS_META[s].label}</option>
          ))}
        </Select>
        <Select value={mode} onChange={(e) => setMode(e.target.value)} className="w-auto">
          <option value="">Run + Submit</option>
          <option value="submit">Submit only</option>
          <option value="run">Run only</option>
        </Select>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <Loading label="Loading submissions…" />
        ) : error ? (
          <ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState title="No submissions match" description="Adjust the filters above." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-wider text-ink-mute">
                  <th className="px-3 py-2.5 font-semibold">User</th>
                  <th className="px-3 py-2.5 font-semibold">Question</th>
                  <th className="px-3 py-2.5 font-semibold">Lang</th>
                  <th className="px-3 py-2.5 font-semibold">Verdict</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Tests</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Time</th>
                  <th className="px-3 py-2.5 text-right font-semibold">When</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const meta = STATUS_META[s.status];
                  const pending = !TERMINAL_STATUSES.includes(s.status);
                  return (
                    <tr key={s.id} className="border-b border-line last:border-b-0 hover:bg-ground">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={s.username} className="size-7 text-[10px]" />
                          <span className="font-mono text-[12.5px]">{s.username}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-[13.5px]">{s.question_title}</td>
                      <td className="px-3 py-2.5 font-mono text-[11.5px] text-ink-mute">{s.language_name}</td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold",
                            toneClass(meta.tone),
                          )}
                        >
                          {pending ? <span className="size-1.5 animate-pulse rounded-full bg-current" /> : null}
                          {meta.label}
                        </span>
                        {s.mode === "run" ? (
                          <span className="ml-1.5 font-mono text-[10px] text-ink-mute">run</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-[12px] tabular-nums">
                        {s.passed_count}/{s.total_count}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-[11.5px] text-ink-mute tabular-nums">
                        {s.execution_time_ms != null ? `${s.execution_time_ms}ms` : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-[11px] text-ink-mute">
                        {timeAgo(s.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
