"use client";

import { cn } from "@/lib/cn";
import { STATUS_META, type Submission } from "@/lib/solve";

const TONE: Record<string, string> = {
  ok: "text-ok bg-ok-soft",
  bad: "text-bad bg-bad-soft",
  warn: "text-warn bg-warn-soft",
  run: "text-tan bg-tan-soft",
};

function Dots({ passed, total, done }: { passed: number; total: number; done: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: Math.max(total, 1) }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "size-3 rounded-[4px]",
            !done ? "animate-pulse bg-warn" : i < passed ? "bg-ok" : "bg-bad",
          )}
        />
      ))}
    </div>
  );
}

export function ResultPanel({
  submission,
  judging,
}: {
  submission: Submission | null;
  judging: boolean;
}) {
  if (!submission && !judging) {
    return (
      <div className="rounded-2xl border border-dashed border-line-2 bg-surface px-4 py-6 text-center text-[13px] text-ink-mute">
        Run against the samples, then submit to judge against all test cases.
      </div>
    );
  }

  const status = submission?.status ?? "processing";
  const meta = STATUS_META[status];
  const done = !!submission && !judging && meta.tone !== "run";
  const isRun = submission?.mode === "run";

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[12px] font-semibold", TONE[meta.tone])}>
          {meta.label}
        </span>
        {submission ? (
          <span className="font-mono text-[13px] text-ink-dim">
            {submission.passed_count} / {submission.total_count} passed
          </span>
        ) : (
          <span className="font-mono text-[13px] text-tan">running…</span>
        )}
        {submission && submission.mode === "submit" && submission.score_awarded > 0 ? (
          <span className="ml-auto font-mono text-[13px] font-semibold text-ember">
            +{submission.score_awarded} pts
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-5 px-4 py-3">
        <Dots passed={submission?.passed_count ?? 0} total={submission?.total_count ?? 3} done={done} />
        {submission?.execution_time_ms != null ? (
          <span className="font-mono text-[12px] text-ink-mute">
            runtime <b className="text-ink">{submission.execution_time_ms} ms</b>
          </span>
        ) : null}
        {submission?.memory_used_kb != null ? (
          <span className="font-mono text-[12px] text-ink-mute">
            memory <b className="text-ink">{(submission.memory_used_kb / 1024).toFixed(1)} MB</b>
          </span>
        ) : null}
      </div>

      {submission?.error_message ? (
        <pre className="mx-4 mb-4 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-line bg-ground p-3 font-mono text-[12px] text-bad">
          {submission.error_message}
        </pre>
      ) : null}

      {/* per-sample detail (run only reveals I/O) */}
      {isRun && submission ? (
        <div className="border-t border-line">
          {submission.results.map((r) => (
            <details key={r.index} className="border-b border-line last:border-b-0">
              <summary className="flex cursor-pointer items-center gap-2 px-4 py-2.5 text-[13px]">
                <span className={cn("size-2.5 rounded-full", r.is_correct ? "bg-ok" : "bg-bad")} />
                <span className="font-mono">Sample {r.index + 1}</span>
                <span className={cn("font-mono text-[12px]", r.is_correct ? "text-ok" : "text-bad")}>
                  {r.is_correct ? "passed" : "failed"}
                </span>
              </summary>
              <div className="grid gap-3 px-4 pb-3 sm:grid-cols-3">
                <Field label="input" value={r.input ?? ""} />
                <Field label="expected" value={r.expected_output ?? ""} />
                <Field label="your output" value={r.stdout ?? ""} bad={!r.is_correct} />
              </div>
            </details>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, value, bad }: { label: string; value: string; bad?: boolean }) {
  return (
    <div>
      <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-ink-mute">{label}</div>
      <pre
        className={cn(
          "max-h-28 overflow-auto whitespace-pre-wrap rounded-md border border-line bg-ground p-2 font-mono text-[12px]",
          bad ? "text-bad" : "text-ink-dim",
        )}
      >
        {value || "—"}
      </pre>
    </div>
  );
}
