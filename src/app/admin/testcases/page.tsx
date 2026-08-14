"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { contentApi, type QuestionListItem } from "@/lib/content";
import { apiErrorMessage } from "@/lib/api";
import { TestcasePanel } from "@/components/admin/testcase-panel";
import { DifficultyBadge } from "@/components/ui/badge";
import { Loading, ErrorState, EmptyState } from "@/components/ui/feedback";
import { IconSearch } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

export default function AdminTestcasesPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<QuestionListItem | null>(null);

  const params: Record<string, string> = { kind: "code" };
  if (search.trim()) params.search = search.trim();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["testcase-questions", search.trim()],
    queryFn: () => contentApi.listQuestions(params),
  });

  const rows = data?.results ?? [];

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ember">admin / content / test cases</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[clamp(22px,3vw,28px)] font-extrabold tracking-tight">Test cases</h1>
        {data ? (
          <span className="font-mono text-[12px] text-ink-mute">{data.count} coding questions</span>
        ) : null}
      </div>
      <p className="mt-2 max-w-[64ch] text-sm text-ink-dim">
        Pick a coding question to review its sample and hidden test cases, add them
        manually, or bulk-import from CSV.
      </p>

      {/* question picker */}
      <div className="mt-4 flex items-center gap-2 rounded-[9px] border border-line bg-surface px-3 py-2 font-mono text-[13px] text-ink-mute transition-colors focus-within:border-ember-line">
        <IconSearch className="size-[15px]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search a question by title or slug…"
          className="w-full bg-transparent text-ink outline-none placeholder:text-ink-mute"
        />
      </div>

      <div className="mt-3">
        {isLoading ? (
          <Loading label="Loading questions…" />
        ) : error ? (
          <ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No coding questions found"
            description="Create a coding question first, then add its test cases here."
          />
        ) : (
          <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
            {rows.map((q) => {
              const active = selected?.id === q.id;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setSelected(q)}
                  className={cn(
                    "flex items-center gap-3 border-b border-line px-4 py-2.5 text-left transition-colors last:border-b-0",
                    active ? "bg-ember-soft" : "hover:bg-ground",
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      active ? "bg-ember" : "bg-line-2",
                    )}
                  />
                  <span className={cn("flex-1 truncate text-[14px]", active && "text-ember")}>
                    {q.title}
                  </span>
                  <DifficultyBadge difficulty={q.difficulty} showScore={false} />
                  <span className="w-24 text-right font-mono text-[11.5px] text-ink-mute tabular-nums">
                    {q.testcase_count} test{q.testcase_count === 1 ? "" : "s"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {data && data.count > rows.length ? (
          <p className="mt-2 font-mono text-[11.5px] text-ink-mute">
            Showing {rows.length} of {data.count}. Refine the search to narrow down.
          </p>
        ) : null}
      </div>

      {/* selected question's test cases */}
      {selected ? (
        <div className="mt-5">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h2 className="text-[15px] font-bold">
              {selected.title}
            </h2>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="font-mono text-[12px] text-ink-mute hover:text-ember"
            >
              clear
            </button>
          </div>
          <TestcasePanel questionId={selected.id} />
        </div>
      ) : null}
    </div>
  );
}
