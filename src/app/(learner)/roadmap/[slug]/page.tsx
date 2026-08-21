"use client";

import Link from "next/link";
import { BackLink } from "@/components/ui/back-link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { contentApi, type RoadmapLesson, type LessonState } from "@/lib/content";
import { apiErrorMessage } from "@/lib/api";
import { Loading, ErrorState } from "@/components/ui/feedback";
import { IconCheck, IconLock, IconArrowRight, IconChevronRight, IconBook } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

const LESSON_CHIP: Record<LessonState, { label: string; cls: string }> = {
  complete: { label: "Done", cls: "text-ok bg-ok-soft" },
  current: { label: "In progress", cls: "text-ember bg-ember-soft" },
  locked: { label: "Locked", cls: "text-ink-mute bg-elevated" },
  open: { label: "Bonus", cls: "text-tan bg-tan-soft" },
};

function LessonNode({ state }: { state: LessonState }) {
  if (state === "complete")
    return (
      <span className="grid size-8 place-items-center rounded-full bg-ok-soft text-ok">
        <IconCheck className="size-[17px]" />
      </span>
    );
  if (state === "locked")
    return (
      <span className="grid size-8 place-items-center rounded-full bg-elevated text-ink-mute">
        <IconLock className="size-[15px]" />
      </span>
    );
  if (state === "current")
    return (
      <span className="bg-brand-grad brand-glow-sm grid size-8 place-items-center rounded-full text-white">
        <IconArrowRight className="size-[17px]" />
      </span>
    );
  return <span className="grid size-8 place-items-center rounded-full border border-dashed border-line-2 text-tan"><IconBook className="size-[15px]" /></span>;
}

function LessonRow({ slug, lesson, last }: { slug: string; lesson: RoadmapLesson; last: boolean }) {
  const solved = lesson.questions.filter((q) => q.is_solved && q.is_required).length;
  const total = lesson.required_count;
  const chip = LESSON_CHIP[lesson.state];
  const locked = lesson.state === "locked";

  const inner = (
    <>
      {/* node + connector rail */}
      <div className="relative flex flex-col items-center">
        <LessonNode state={lesson.state} />
        {!last ? <span className="absolute top-8 h-[calc(100%-0px)] w-px bg-line" /> : null}
      </div>
      <div className="min-w-0 flex-1 pb-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("text-[15px] font-semibold", !locked && "group-hover:text-ember")}>
            {lesson.title}
          </span>
          <span className={cn("rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold", chip.cls)}>
            {chip.label}
          </span>
        </div>
        {lesson.description ? (
          <p className="mt-0.5 text-[12.5px] text-ink-mute">{lesson.description}</p>
        ) : null}
        {total > 0 ? (
          <div className="mt-1 font-mono text-[11px] text-ink-mute tabular-nums">
            {solved}/{total} steps done
          </div>
        ) : null}
      </div>
      {!locked ? (
        <IconChevronRight className="mt-1 size-4 shrink-0 text-ink-mute transition-colors group-hover:text-ember" />
      ) : null}
    </>
  );

  if (locked) {
    return (
      <div className="flex cursor-not-allowed gap-3.5 px-5 py-3 opacity-70" title="Finish the earlier lessons to unlock this">
        {inner}
      </div>
    );
  }
  return (
    <Link
      href={`/roadmap/${slug}/${lesson.slug}`}
      className="group flex gap-3.5 px-5 py-3 transition-colors hover:bg-elevated"
    >
      {inner}
    </Link>
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

  const allQuestions = data?.modules.flatMap((m) => m.lessons.flatMap((l) => l.questions)) ?? [];
  const requiredQs = allQuestions.filter((q) => q.is_required);
  const solvedCount = requiredQs.filter((q) => q.is_solved).length;
  const pct = requiredQs.length ? Math.round((solvedCount / requiredQs.length) * 100) : 0;
  const complete = requiredQs.length > 0 && solvedCount === requiredQs.length;

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink href="/roadmap">Roadmap</BackLink>

      {isLoading ? (
        <Loading label="Loading track…" />
      ) : error ? (
        <div className="mt-4"><ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} /></div>
      ) : !data ? null : (
        <>
          <h1 className="mt-2 text-[clamp(22px,3vw,30px)] font-extrabold tracking-tight">{data.title}</h1>
          <p className="mt-2 max-w-[65ch] text-sm text-ink-dim">{data.description}</p>

          {/* progress hero */}
          <div className="bg-brand-grad-soft brand-grad-border relative mt-5 overflow-hidden rounded-2xl p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-ink-mute">Track progress</div>
                <div className="mt-1 text-[26px] font-extrabold tabular-nums">
                  <span className={complete ? "text-ok" : "text-brand-grad"}>{solvedCount}</span>
                  <span className="text-ink-mute"> / {requiredQs.length}</span>
                  <span className="ml-1.5 text-[15px] font-semibold text-ink-mute">must-do solved</span>
                </div>
              </div>
              <div className={cn("font-mono text-[22px] font-extrabold tabular-nums", complete ? "text-ok" : "text-ember")}>
                {pct}%
              </div>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-elevated">
              <div
                className={cn("h-full rounded-full transition-[width] duration-700 ease-out", complete ? "bg-ok" : "bg-brand-grad")}
                style={{ width: `${pct}%` }}
              />
            </div>
            {complete ? (
              <p className="mt-2.5 inline-flex items-center gap-1.5 font-mono text-[12px] font-semibold text-ok">
                <IconCheck className="size-4" /> Track mastered — every challenge cleared!
              </p>
            ) : null}
          </div>

          {/* module map */}
          <div className="mt-6 flex flex-col gap-4">
            {data.modules.map((module, mi) => (
              <div key={module.id} className="overflow-hidden rounded-2xl border border-line bg-surface">
                <div className="flex items-center gap-3 border-b border-line px-5 py-4">
                  <span className="bg-brand-grad brand-glow-sm grid size-8 place-items-center rounded-[10px] font-mono text-[14px] font-bold text-white">
                    {mi + 1}
                  </span>
                  <div className="flex-1">
                    <b className="text-[15.5px]">{module.title}</b>
                    {module.description ? (
                      <p className="mt-0.5 text-[12.5px] text-ink-mute">{module.description}</p>
                    ) : null}
                  </div>
                  <span className="font-mono text-[12px] text-ink-mute">
                    {module.lessons.length} {module.lessons.length === 1 ? "lesson" : "lessons"}
                  </span>
                </div>

                {module.lessons.length > 0 ? (
                  <div className="py-1">
                    {module.lessons.map((lesson, li) => (
                      <LessonRow
                        key={lesson.id}
                        slug={slug}
                        lesson={lesson}
                        last={li === module.lessons.length - 1}
                      />
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
