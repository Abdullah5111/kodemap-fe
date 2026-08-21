"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { contentApi, type RoadmapLesson, type RoadmapQuestion } from "@/lib/content";
import { apiErrorMessage } from "@/lib/api";
import { Loading, ErrorState } from "@/components/ui/feedback";
import { DifficultyBadge } from "@/components/ui/badge";
import {
  IconChevronRight,
  IconCheck,
  IconLock,
  IconArrowRight,
  IconBook,
} from "@/components/ui/icons";
import {
  LessonLangProvider,
  LangTabs,
  LessonBlocks,
  InlineExercise,
} from "@/components/learn/lesson-content";
import { Confetti } from "@/components/learn/confetti";
import { cn } from "@/lib/cn";

export default function LessonPage() {
  const params = useParams<{ slug: string; lessonSlug: string }>();
  const { slug, lessonSlug } = params;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["track", slug],
    queryFn: () => contentApi.track(slug),
    enabled: !!slug,
  });

  // Flatten lessons in roadmap order for prev/next navigation.
  const flat =
    data?.modules.flatMap((m) => m.lessons.map((l) => ({ lesson: l, moduleTitle: m.title }))) ?? [];
  const idx = flat.findIndex((f) => f.lesson.slug === lessonSlug);
  const here = idx >= 0 ? flat[idx] : null;
  const next = idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null;
  const lesson = here?.lesson;

  // Fire confetti when the lesson transitions into "complete".
  const prevState = useRef<string | null>(null);
  const [fire, setFire] = useState(false);
  useEffect(() => {
    if (!lesson) return;
    if (prevState.current === null) {
      prevState.current = lesson.state;
      return;
    }
    if (prevState.current !== "complete" && lesson.state === "complete") setFire(true);
    prevState.current = lesson.state;
  }, [lesson]);

  return (
    <div className="mx-auto max-w-3xl">
      <Confetti fire={fire} />

      {/* breadcrumb */}
      <div className="flex items-center gap-1.5 font-mono text-[12px] text-ink-mute">
        <Link href="/roadmap" className="hover:text-ember">Roadmap</Link>
        <IconChevronRight className="size-3.5" />
        <Link href={`/roadmap/${slug}`} className="hover:text-ember">
          {data?.title ?? "Track"}
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-6"><Loading label="Loading lesson…" /></div>
      ) : error ? (
        <div className="mt-6"><ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} /></div>
      ) : !lesson ? (
        <div className="mt-6"><ErrorState message="That lesson doesn't exist in this track." /></div>
      ) : lesson.state === "locked" ? (
        <LockedLesson trackSlug={slug} />
      ) : (
        <>
          <header className="mt-3">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ember">
              <IconBook className="size-[14px]" /> {here?.moduleTitle}
            </div>
            <h1 className="mt-1.5 text-[clamp(22px,3vw,30px)] font-extrabold tracking-tight">
              {lesson.title}
            </h1>
            {lesson.description ? (
              <p className="mt-1.5 max-w-[68ch] text-[14px] text-ink-dim">{lesson.description}</p>
            ) : null}
          </header>

          <LessonLangProvider blocks={lesson.content} trackSlug={slug}>
            {lesson.content.some((b) => b.t === "code") ? (
              <div className="mt-5">
                <LangTabs />
              </div>
            ) : null}
            <div className="mt-5">
              <LessonBlocks blocks={lesson.content} />
            </div>

            {/* Drills that aren't embedded in the theory (e.g. legacy lessons with
                no content yet) still render, so every lesson is usable. */}
            {(() => {
              const embedded = new Set(
                lesson.content.filter((b) => b.t === "exercise").map((b) => (b as { slug: string }).slug),
              );
              const extras = lesson.questions.filter(
                (q) => q.kind === "exercise" && !embedded.has(q.slug),
              );
              if (!extras.length) return null;
              return (
                <div className="mt-5 flex flex-col gap-5">
                  {extras.map((q) => (
                    <InlineExercise key={q.id} slug={q.slug} />
                  ))}
                </div>
              );
            })()}
          </LessonLangProvider>

          <ChallengeCard lesson={lesson} />

          {lesson.state === "complete" ? (
            <div className="mt-6 animate-pop-in rounded-2xl border border-ok/40 bg-ok-soft/40 p-5 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-ok-soft text-ok">
                <IconCheck className="size-7" />
              </div>
              <p className="mt-2 text-[16px] font-bold text-ok">Lesson complete!</p>
              <p className="mt-0.5 text-[13px] text-ink-dim">Nice work — you&apos;ve mastered this one.</p>
            </div>
          ) : null}

          {next ? (
            <Link
              href={`/roadmap/${slug}/${next.lesson.slug}`}
              className="group mt-4 flex items-center justify-between rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-ember-line hover:bg-elevated"
            >
              <span>
                <span className="font-mono text-[11px] uppercase tracking-wider text-ink-mute">Up next</span>
                <span className="block text-[15px] font-semibold group-hover:text-ember">{next.lesson.title}</span>
              </span>
              <IconArrowRight className="size-5 text-ink-mute transition-colors group-hover:text-ember" />
            </Link>
          ) : (
            <Link
              href={`/roadmap/${slug}`}
              className="mt-4 flex items-center justify-center rounded-2xl border border-line bg-surface p-4 text-[14px] font-semibold hover:text-ember"
            >
              Back to the track
            </Link>
          )}
        </>
      )}
    </div>
  );
}

function LockedLesson({ trackSlug }: { trackSlug: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-line bg-surface p-8 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-full bg-elevated text-ink-mute">
        <IconLock className="size-6" />
      </div>
      <p className="mt-3 text-[15px] font-semibold">This lesson is locked</p>
      <p className="mt-1 text-[13px] text-ink-dim">Finish the earlier lessons first to unlock it.</p>
      <Link href={`/roadmap/${trackSlug}`} className="mt-4 inline-block font-mono text-[13px] text-ember hover:underline">
        ← Back to the track
      </Link>
    </div>
  );
}

/** The prominent end-of-lesson coding challenge. */
function ChallengeCard({ lesson }: { lesson: RoadmapLesson }) {
  const problem: RoadmapQuestion | undefined = lesson.questions.find((q) => q.kind === "code");
  if (!problem) return null;

  const locked = problem.state === "locked" || !problem.is_unlocked;
  const solved = problem.is_solved;

  const body = (
    <div
      className={cn(
        "relative mt-8 overflow-hidden rounded-2xl border p-5",
        solved ? "border-ok/40" : locked ? "border-line" : "border-ember-line",
      )}
    >
      {!locked && !solved ? <div className="bg-brand-aura pointer-events-none absolute inset-0" /> : null}
      <div className="relative flex items-center gap-4">
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-xl",
            solved ? "bg-ok-soft text-ok" : locked ? "bg-elevated text-ink-mute" : "bg-brand-grad text-white",
          )}
        >
          {solved ? <IconCheck className="size-6" /> : locked ? <IconLock className="size-5" /> : <IconArrowRight className="size-6" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-mute">
            {solved ? "Challenge cleared" : "Your challenge"}
          </div>
          <div className="text-[16px] font-bold">{problem.title}</div>
        </div>
        <DifficultyBadge difficulty={problem.difficulty} />
      </div>
      <p className="relative mt-2 text-[13px] text-ink-dim">
        {solved
          ? "You solved this — revisit it any time to try another language."
          : locked
            ? "Work through the theory and drills above to unlock the challenge."
            : "Put it into practice: complete the function and get it accepted in any of the four languages."}
      </p>
    </div>
  );

  if (locked) return body;
  return (
    <Link href={`/questions/${problem.slug}`} className="block transition-transform hover:-translate-y-0.5">
      {body}
    </Link>
  );
}
