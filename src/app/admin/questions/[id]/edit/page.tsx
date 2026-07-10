"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { contentApi } from "@/lib/content";
import { apiErrorMessage } from "@/lib/api";
import { QuestionForm } from "@/components/admin/question-form";
import { TestcasePanel } from "@/components/admin/testcase-panel";
import { DifficultyBadge, StatusDot } from "@/components/ui/badge";
import { Loading, ErrorState } from "@/components/ui/feedback";

export default function EditQuestionPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["question", id],
    queryFn: () => contentApi.getQuestion(id),
    enabled: Number.isFinite(id),
  });

  return (
    <div className="mx-auto max-w-[820px]">
      <Link href="/admin/questions" className="font-mono text-[12px] text-ink-mute hover:text-ember">
        ← question bank
      </Link>

      {isLoading ? (
        <Loading label="Loading question…" />
      ) : error ? (
        <div className="mt-4">
          <ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} />
        </div>
      ) : !data ? null : (
        <>
          <div className="mt-2 mb-4 flex flex-wrap items-center gap-3">
            <h1 className="text-[clamp(20px,3vw,25px)] font-bold tracking-tight">{data.title}</h1>
            <DifficultyBadge difficulty={data.difficulty} />
            <StatusDot active={data.is_active} label={data.is_active ? "Live" : "Draft"} />
            {saved ? <span className="font-mono text-[12px] text-ok">saved ✓</span> : null}
          </div>

          <div className="flex flex-col gap-4">
            <QuestionForm
              mode="edit"
              question={data}
              onSaved={(q) => {
                qc.setQueryData(["question", id], q);
                qc.invalidateQueries({ queryKey: ["admin-questions"] });
                setSaved(true);
                setTimeout(() => setSaved(false), 2500);
              }}
            />
            <TestcasePanel questionId={id} />
          </div>
        </>
      )}
    </div>
  );
}
