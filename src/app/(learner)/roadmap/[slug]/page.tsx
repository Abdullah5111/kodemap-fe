"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { contentApi } from "@/lib/content";
import { apiErrorMessage } from "@/lib/api";
import { Loading, ErrorState } from "@/components/ui/feedback";

export default function TrackTreePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["track", slug],
    queryFn: () => contentApi.track(slug),
    enabled: !!slug,
  });

  const totalQuestions =
    data?.modules.reduce(
      (sum, m) => sum + m.lessons.reduce((s, l) => s + l.question_count, 0),
      0,
    ) ?? 0;

  return (
    <div>
      <Link href="/roadmap" className="font-mono text-[12px] text-ink-mute hover:text-ember">
        ← roadmap
      </Link>

      {isLoading ? (
        <Loading label="Loading track…" />
      ) : error ? (
        <div className="mt-4">
          <ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} />
        </div>
      ) : !data ? null : (
        <>
          <h1 className="mt-2 text-[clamp(21px,3vw,27px)] font-bold tracking-tight">{data.title}</h1>
          <p className="mt-2 max-w-[65ch] text-sm text-ink-dim">{data.description}</p>
          <div className="mt-3 flex items-center gap-4 font-mono text-[12px] text-ink-mute">
            <span>
              <span className="text-ink">{data.modules.length}</span> modules
            </span>
            <span>
              <span className="text-ink">{totalQuestions}</span> must-do questions
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            {data.modules.map((module, mi) => (
              <div key={module.id} className="overflow-hidden rounded-2xl border border-line bg-surface">
                <div className="flex items-center gap-3 px-5 py-4">
                  <span className="grid size-8 place-items-center rounded-[9px] bg-elevated font-mono text-[13px] font-bold text-tan">
                    {mi + 1}
                  </span>
                  <div className="flex-1">
                    <b className="text-[15px]">{module.title}</b>
                    {module.description ? (
                      <p className="mt-0.5 text-[12.5px] text-ink-mute">{module.description}</p>
                    ) : null}
                  </div>
                  <span className="font-mono text-[12px] text-ink-mute">
                    {module.lessons.length} {module.lessons.length === 1 ? "lesson" : "lessons"}
                  </span>
                </div>

                {module.lessons.length > 0 ? (
                  <div className="border-t border-line">
                    {module.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-3 border-b border-line px-5 py-3 last:border-b-0"
                      >
                        <span className="size-2 rounded-full bg-line-2" />
                        <div className="flex-1">
                          <span className="text-[14px]">{lesson.title}</span>
                          {lesson.description ? (
                            <p className="text-[12px] text-ink-mute">{lesson.description}</p>
                          ) : null}
                        </div>
                        <span className="font-mono text-[12px] text-ink-mute">
                          {lesson.question_count} {lesson.question_count === 1 ? "question" : "questions"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <p className="mt-6 rounded-xl border border-line border-l-[3px] border-l-tan bg-surface px-4 py-3 text-[13px] text-ink-dim">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wide text-tan">
              next
            </span>{" "}
            Step unlocking, per-question solving, and progress tracking arrive with the submissions
            build.
          </p>
        </>
      )}
    </div>
  );
}
