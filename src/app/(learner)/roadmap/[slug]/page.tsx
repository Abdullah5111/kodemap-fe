"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  contentApi,
  type RoadmapLesson,
  type RoadmapQuestion,
  type LessonState,
} from "@/lib/content";
import { apiErrorMessage } from "@/lib/api";
import { Loading, ErrorState } from "@/components/ui/feedback";
import { DifficultyBadge } from "@/components/ui/badge";
import { IconCheck, IconLock, IconArrowRight } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

// --- lesson header status chip ---------------------------------------------
const LESSON_CHIP: Record<LessonState, { label: string; cls: string }> = {
  complete: { label: "Complete", cls: "text-ok bg-ok-soft" },
  current: { label: "In progress", cls: "text-ember bg-ember-soft" },
  locked: { label: "Locked", cls: "text-ink-mute bg-elevated" },
  open: { label: "Bonus", cls: "text-tan bg-tan-soft" },
};

function LessonChip({ state }: { state: LessonState }) {
  const c = LESSON_CHIP[state];
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 font-mono text-[10.5px] font-semibold", c.cls)}>
      {c.label}
    </span>
  );
}

// --- a single question row --------------------------------------------------
function QuestionRow({ q }: { q: RoadmapQuestion }) {
  const locked = q.state === "locked";

  const marker =
    q.state === "solved" ? (
      <span className="grid size-5 place-items-center rounded-full bg-ok-soft text-ok">
        <IconCheck className="size-[13px]" />
      </span>
    ) : locked ? (
      <span className="grid size-5 place-items-center rounded-full bg-elevated text-ink-mute">
        <IconLock className="size-[12px]" />
      </span>
    ) : q.state === "current" ? (
      <span className="grid size-5 place-items-center rounded-full bg-ember text-ground">
        <IconArrowRight className="size-[13px]" />
      </span>
    ) : (
      <span className="size-5 rounded-full border border-dashed border-line-2" />
    );

  const inner = (
    <>
      {marker}
      <span className={cn("flex-1", q.state === "solved" && "text-ink-dim")}>{q.title}</span>
      {!q.is_required ? (
        <span className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-tan">
          bonus
        </span>
      ) : null}
      <DifficultyBadge difficulty={q.difficulty} />
    </>
  );

  if (locked) {
    return (
      <div
        className="flex cursor-not-allowed items-center gap-2.5 rounded-lg border border-line bg-ground/40 px-3 py-2 text-[13.5px] text-ink-mute"
        title="Solve the previous question to unlock this one"
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={`/questions/${q.slug}`}
      className={cn(
        "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-[13.5px] transition-colors hover:text-ember",
        q.state === "current"
          ? "border-ember-line bg-ember-soft/40 hover:border-ember-line"
          : "border-line bg-ground hover:border-line-2",
      )}
    >
      {inner}
    </Link>
  );
}

function LessonBlock({ lesson }: { lesson: RoadmapLesson }) {
  const solved = lesson.questions.filter((q) => q.is_solved && q.is_required).length;
  const total = lesson.required_count;

  return (
    <div className="border-b border-line px-5 py-3 last:border-b-0">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "size-2 rounded-full",
            lesson.state === "complete"
              ? "bg-ok"
              : lesson.state === "current"
                ? "bg-ember"
                : "bg-line-2",
          )}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[14px]">{lesson.title}</span>
            <LessonChip state={lesson.state} />
          </div>
          {lesson.description ? (
            <p className="text-[12px] text-ink-mute">{lesson.description}</p>
          ) : null}
        </div>
        <span className="font-mono text-[12px] text-ink-mute tabular-nums">
          {total > 0 ? `${solved}/${total}` : `${lesson.question_count}`}{" "}
          {total > 0 ? "solved" : lesson.question_count === 1 ? "question" : "questions"}
        </span>
      </div>

      {lesson.questions.length > 0 ? (
        <div className="mt-2.5 flex flex-col gap-1.5 pl-5">
          {lesson.questions.map((q) => (
            <QuestionRow key={q.id} q={q} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function TrackTreePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["track", slug],
    queryFn: () => contentApi.track(slug),
    enabled: !!slug,
  });

  const allQuestions =
    data?.modules.flatMap((m) => m.lessons.flatMap((l) => l.questions)) ?? [];
  const requiredQs = allQuestions.filter((q) => q.is_required);
  const solvedCount = requiredQs.filter((q) => q.is_solved).length;
  const pct = requiredQs.length ? Math.round((solvedCount / requiredQs.length) * 100) : 0;

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

          {/* progress bar */}
          <div className="mt-4 max-w-md">
            <div className="flex items-center justify-between font-mono text-[12px] text-ink-mute">
              <span>
                <span className="text-ink">{solvedCount}</span> / {requiredQs.length} must-do solved
              </span>
              <span className="text-ember">{pct}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-elevated">
              <div
                className="h-full rounded-full bg-ember transition-[width]"
                style={{ width: `${pct}%` }}
              />
            </div>
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
                      <LessonBlock key={lesson.id} lesson={lesson} />
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
