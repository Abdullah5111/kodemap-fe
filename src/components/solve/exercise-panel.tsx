"use client";

import { useMemo, useState } from "react";
import {
  solveApi,
  type ExerciseDetail,
  type ExerciseAttempt,
} from "@/lib/solve";
import { apiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { IconCheck, IconLock } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

const MARKER = "____";

/**
 * Renders a fill-blank snippet as code segments with inputs where the ____
 * markers are, so learners type the answer in place rather than in a form far
 * from the code.
 */
function FillBlankCode({
  code,
  answers,
  onChange,
  results,
  disabled,
}: {
  code: string;
  answers: string[];
  onChange: (i: number, v: string) => void;
  results: ExerciseAttempt["results"] | null;
  disabled: boolean;
}) {
  const segments = useMemo(() => code.split(MARKER), [code]);

  return (
    <pre className="overflow-x-auto rounded-xl border border-line bg-ground p-4 font-mono text-[13px] leading-[1.9] text-ink-dim">
      {segments.map((seg, i) => {
        const res = results?.[i];
        return (
          <span key={i}>
            {seg}
            {i < segments.length - 1 ? (
              <input
                value={answers[i] ?? ""}
                onChange={(e) => onChange(i, e.target.value)}
                disabled={disabled}
                aria-label={`Blank ${i + 1}`}
                spellCheck={false}
                autoComplete="off"
                className={cn(
                  "mx-1 w-[9ch] rounded-md border bg-surface px-2 py-0.5 text-center font-mono text-[13px] text-ink outline-none transition-colors focus:border-ember",
                  res === undefined
                    ? "border-line-2"
                    : res.is_correct
                      ? "border-ok text-ok"
                      : "border-bad text-bad",
                  disabled && "opacity-70",
                )}
              />
            ) : null}
          </span>
        );
      })}
    </pre>
  );
}

export function ExercisePanel({
  slug,
  exercise,
  alreadySolved,
  locked,
  onSolved,
}: {
  slug: string;
  exercise: ExerciseDetail;
  alreadySolved: boolean;
  locked: boolean;
  onSolved: () => void;
}) {
  const blankCount = Math.max(1, exercise.blanks.length);
  const [answers, setAnswers] = useState<string[]>(() => Array(blankCount).fill(""));
  const [attempt, setAttempt] = useState<ExerciseAttempt | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tries, setTries] = useState(0);

  const isPredict = exercise.type === "predict_output";
  const solved = attempt?.is_correct || alreadySolved;
  const hasAnswer = answers.some((a) => a.trim() !== "");

  function setAnswer(i: number, v: string) {
    setAnswers((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
    // Clear stale per-blank marks as soon as they start editing again.
    if (attempt && !attempt.is_correct) setAttempt(null);
  }

  async function check() {
    if (checking || locked) return;
    setChecking(true);
    setError(null);
    try {
      const res = await solveApi.attemptExercise(slug, answers);
      setAttempt(res);
      setTries((t) => t + 1);
      if (res.is_correct) onSolved();
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't check your answer."));
    } finally {
      setChecking(false);
    }
  }

  function tryAgain() {
    setAttempt(null);
    if (isPredict) setAnswers(Array(blankCount).fill(""));
  }

  return (
    <div className="flex flex-col gap-4">
      {/* the snippet */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-[11px] uppercase tracking-wider text-ink-mute">
            {isPredict ? "What does this print?" : "Complete the code"}
          </h2>
          <span className="font-mono text-[11px] text-ink-mute">
            {exercise.language_hint}
          </span>
        </div>

        <div className="mt-3">
          {isPredict ? (
            <pre className="overflow-x-auto rounded-xl border border-line bg-ground p-4 font-mono text-[13px] leading-relaxed text-ink-dim">
              {exercise.code}
            </pre>
          ) : (
            <FillBlankCode
              code={exercise.code}
              answers={answers}
              onChange={setAnswer}
              results={attempt?.results ?? null}
              disabled={solved || locked}
            />
          )}
        </div>

        {/* predict-output answer box */}
        {isPredict ? (
          <div className="mt-4">
            <label
              htmlFor="exercise-output"
              className="font-mono text-[11px] uppercase tracking-wider text-ink-mute"
            >
              Your answer
            </label>
            <textarea
              id="exercise-output"
              value={answers[0] ?? ""}
              onChange={(e) => setAnswer(0, e.target.value)}
              disabled={solved || locked}
              spellCheck={false}
              placeholder="Type exactly what the program prints…"
              className={cn(
                "mt-1.5 min-h-[92px] w-full resize-y rounded-xl border bg-ground p-3 font-mono text-[13px] leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-mute focus:border-ember",
                attempt && !attempt.is_correct ? "border-bad" : "border-line",
                (solved || locked) && "opacity-70",
              )}
            />
            <p className="mt-1 font-mono text-[11px] text-ink-mute">
              One line per line of output. Trailing blank lines are ignored.
            </p>
          </div>
        ) : null}

        {/* actions */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {solved ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-3 py-1 font-mono text-[12px] font-semibold text-ok">
              <IconCheck className="size-4" />
              Correct
            </span>
          ) : (
            <Button size="sm" onClick={check} disabled={checking || locked || !hasAnswer}>
              {locked ? <IconLock className="size-4" /> : null}
              {checking ? "Checking…" : locked ? "Locked" : "Check answer"}
            </Button>
          )}

          {attempt && !attempt.is_correct ? (
            <Button variant="ghost" size="sm" onClick={tryAgain}>
              Try again
            </Button>
          ) : null}

          {attempt && !isPredict ? (
            <span className="font-mono text-[12px] text-ink-mute">
              {attempt.passed_count}/{attempt.total_count} blanks correct
            </span>
          ) : null}
        </div>

        {error ? <p className="mt-3 font-mono text-[12.5px] text-bad">{error}</p> : null}
      </div>

      {/* feedback */}
      {attempt && !attempt.is_correct ? (
        <div className="rounded-2xl border border-line border-l-[3px] border-l-bad bg-surface p-4">
          <p className="text-[14px] font-semibold text-bad">Not quite</p>
          <p className="mt-1 text-[13px] text-ink-dim">
            {isPredict
              ? "Walk through the code one line at a time and track each variable as it changes."
              : "The blanks outlined in red aren't right yet — the green ones are."}
          </p>
          {/* Nudge, not the answer — and only once they've genuinely tried. */}
          {attempt.hint && tries >= 2 ? (
            <p className="mt-2.5 rounded-lg border border-line bg-ground px-3 py-2 text-[13px] text-tan">
              Hint: {attempt.hint}
            </p>
          ) : null}
        </div>
      ) : null}

      {attempt?.is_correct && attempt.explanation ? (
        <div className="rounded-2xl border border-line border-l-[3px] border-l-ok bg-surface p-4">
          <p className="text-[14px] font-semibold text-ok">Why this works</p>
          <p className="mt-1 whitespace-pre-wrap text-[13px] text-ink-dim">
            {attempt.explanation}
          </p>
          {attempt.score_awarded > 0 ? (
            <p className="mt-2 font-mono text-[12px] text-ember">
              +{attempt.score_awarded} points
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
