"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { contentApi, DIFFICULTY_ORDER, DIFFICULTY_META } from "@/lib/content";
import { apiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { DifficultyBadge, StatusDot } from "@/components/ui/badge";
import { Loading, ErrorState, EmptyState } from "@/components/ui/feedback";
import { IconSearch } from "@/components/ui/icons";

export default function AdminQuestionsPage() {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const params: Record<string, string> = {};
  if (difficulty) params.difficulty = difficulty;
  if (status) params.is_active = status;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-questions", difficulty, status],
    queryFn: () => contentApi.listQuestions(params),
  });

  const rows = useMemo(() => {
    const list = data?.results ?? [];
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter(
      (r) => r.title.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q),
    );
  }, [data, search]);

  return (
    <div>
      <p className="font-mono text-[12px] text-ink-mute">admin / content / questions</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[clamp(20px,3vw,25px)] font-bold tracking-tight">Question bank</h1>
        <Link href="/admin/questions/new">
          <Button size="sm">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New question
          </Button>
        </Link>
      </div>

      {/* toolbar */}
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-[9px] border border-line bg-surface px-3 py-2 font-mono text-[13px] text-ink-mute">
          <IconSearch className="size-[15px]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or slug…"
            className="w-full bg-transparent text-ink outline-none placeholder:text-ink-mute"
          />
        </div>
        <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-auto">
          <option value="">All difficulties</option>
          {DIFFICULTY_ORDER.map((d) => (
            <option key={d} value={d}>
              {DIFFICULTY_META[d].label}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto">
          <option value="">All statuses</option>
          <option value="true">Live</option>
          <option value="false">Draft</option>
        </Select>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <Loading label="Loading questions…" />
        ) : error ? (
          <ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No questions found"
            description="Adjust your filters, or create the first question."
            action={
              <Link href="/admin/questions/new">
                <Button size="sm">New question</Button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-wider text-ink-mute">
                  <th className="px-3 py-2.5 font-semibold">Title</th>
                  <th className="px-3 py-2.5 font-semibold">Difficulty</th>
                  <th className="px-3 py-2.5 font-semibold">Topic</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Tests</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((q) => (
                  <tr
                    key={q.id}
                    onClick={() => router.push(`/admin/questions/${q.id}/edit`)}
                    className="cursor-pointer border-b border-line last:border-b-0 hover:bg-ground"
                  >
                    <td className="px-3 py-3 text-[14px] font-medium">{q.title}</td>
                    <td className="px-3 py-3">
                      <DifficultyBadge difficulty={q.difficulty} showScore={false} />
                    </td>
                    <td className="px-3 py-3 font-mono text-[12px] text-ink-mute">
                      {q.topic_name ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-[13px] tabular-nums">
                      {q.testcase_count}
                    </td>
                    <td className="px-3 py-3">
                      <StatusDot active={q.is_active} label={q.is_active ? "Live" : "Draft"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
