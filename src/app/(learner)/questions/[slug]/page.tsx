"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { solveApi, isTerminal, monacoLang, starterCode, type Submission } from "@/lib/solve";
import { apiErrorMessage } from "@/lib/api";
import { DifficultyBadge, Tag } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loading, ErrorState } from "@/components/ui/feedback";
import { CodeEditor } from "@/components/solve/code-editor";
import { ResultPanel } from "@/components/solve/result-panel";
import { ExercisePanel } from "@/components/solve/exercise-panel";
import { IconLock, IconCheck } from "@/components/ui/icons";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function SolvePage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: q, isLoading, error, refetch } = useQuery({
    queryKey: ["solve-question", slug],
    queryFn: () => solveApi.question(slug),
    enabled: !!slug,
  });

  const [langId, setLangId] = useState<number | null>(null);
  const [sources, setSources] = useState<Record<number, string>>({});
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [judging, setJudging] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  // pick a default language once the question loads
  useEffect(() => {
    if (q && langId === null && q.allowed_languages.length > 0) {
      const first = q.allowed_languages[0];
      setLangId(first.id);
      setSources((s) => ({ ...s, [first.id]: s[first.id] ?? starterCode(first.name) }));
    }
  }, [q, langId]);

  const language = useMemo(
    () => q?.allowed_languages.find((l) => l.id === langId) ?? null,
    [q, langId],
  );
  const source = langId != null ? sources[langId] ?? "" : "";

  function selectLang(id: number) {
    const lang = q?.allowed_languages.find((l) => l.id === id);
    setLangId(id);
    setSources((s) => ({ ...s, [id]: s[id] ?? (lang ? starterCode(lang.name) : "") }));
  }

  async function judge(mode: "run" | "submit") {
    if (!q || langId == null || judging) return;
    setRunError(null);
    setJudging(true);
    setSubmission(null);
    try {
      const call = mode === "run" ? solveApi.run : solveApi.submit;
      let sub = await call(slug, { language_id: langId, source_code: source });
      setSubmission(sub);
      // Poll if the backend is still judging (real Judge0). Fake mode returns terminal.
      let guard = 0;
      while (!isTerminal(sub.status) && guard < 60) {
        await sleep(1200);
        sub = await solveApi.getSubmission(sub.id);
        setSubmission(sub);
        guard += 1;
      }
      if (mode === "submit" && sub.status === "accepted") {
        void refetch();
      }
    } catch (err) {
      setRunError(apiErrorMessage(err, "Couldn't run your code."));
    } finally {
      setJudging(false);
    }
  }

  if (isLoading) return <Loading label="Loading problem…" />;
  if (error)
    return (
      <div>
        <Link href="/roadmap" className="font-mono text-[12px] text-ink-mute hover:text-ember">
          ← roadmap
        </Link>
        <div className="mt-4">
          <ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} />
        </div>
      </div>
    );
  if (!q) return null;

  const locked = !q.is_unlocked;

  return (
    <div>
      <Link href="/roadmap" className="font-mono text-[12px] text-ink-mute hover:text-ember">
        ← roadmap
      </Link>

      {locked ? (
        <div className="mt-3 flex items-start gap-3 rounded-xl border border-line border-l-[3px] border-l-ink-mute bg-surface px-4 py-3">
          <IconLock className="mt-0.5 size-[18px] text-ink-mute" />
          <div>
            <p className="text-[14px] font-semibold">This question is locked</p>
            <p className="text-[13px] text-ink-dim">
              Solve the previous must-do question in your roadmap to unlock it. You can read the
              problem, but running and submitting are disabled.
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* problem statement */}
        <div className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-[19px] font-bold tracking-tight">{q.title}</h1>
            {q.is_solved ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ok-soft px-2.5 py-1 font-mono text-[11.5px] font-semibold text-ok">
                <IconCheck className="size-[13px]" />
                Solved
              </span>
            ) : null}
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <DifficultyBadge difficulty={q.difficulty} />
            {q.topic_name ? <Tag>{q.topic_name}</Tag> : null}
            {/* Runtime limits only mean something when code is actually executed. */}
            {q.kind === "exercise" ? (
              <Tag>no coding</Tag>
            ) : (
              <>
                <Tag>time {q.time_limit_ms}ms</Tag>
                <Tag>mem {(q.memory_limit_kb / 1024).toFixed(0)}mb</Tag>
              </>
            )}
          </div>

          <Section title="Problem">
            <p className="whitespace-pre-wrap text-[14px] text-ink-dim">{q.statement}</p>
          </Section>
          {q.kind !== "exercise" && q.input_format ? (
            <Section title="Input">
              <p className="whitespace-pre-wrap text-[14px] text-ink-dim">{q.input_format}</p>
            </Section>
          ) : null}
          {q.kind !== "exercise" && q.output_format ? (
            <Section title="Output">
              <p className="whitespace-pre-wrap text-[14px] text-ink-dim">{q.output_format}</p>
            </Section>
          ) : null}
          {q.constraints ? (
            <Section title="Constraints">
              <pre className="overflow-x-auto rounded-lg border border-line bg-ground p-2.5 font-mono text-[12.5px] text-ink-dim">
                {q.constraints}
              </pre>
            </Section>
          ) : null}
          {q.kind !== "exercise" && q.sample_testcases.length > 0 ? (
            <Section title="Sample cases">
              <div className="flex flex-col gap-2.5">
                {q.sample_testcases.map((c, i) => (
                  <div key={c.id} className="grid gap-2 sm:grid-cols-2">
                    <SampleBox label={`input ${i + 1}`} value={c.input} />
                    <SampleBox label="expected" value={c.expected_output} />
                  </div>
                ))}
              </div>
            </Section>
          ) : null}
        </div>

        {/* exercise (no compiler) or code editor + result */}
        {q.kind === "exercise" && q.exercise ? (
          <ExercisePanel
            slug={slug}
            exercise={q.exercise}
            alreadySolved={q.is_solved}
            locked={locked}
            onSolved={() => void refetch()}
          />
        ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="flex items-center gap-2 border-b border-line bg-elevated px-3 py-2">
              <select
                value={langId ?? ""}
                onChange={(e) => selectLang(Number(e.target.value))}
                className="rounded-md border border-line bg-ground px-2.5 py-1.5 font-mono text-[12.5px] text-ink outline-none"
              >
                {q.allowed_languages.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} {l.version}
                  </option>
                ))}
              </select>
              <span className="ml-auto font-mono text-[11px] text-ink-mute">
                {language ? monacoLang(language.name) : ""}
              </span>
            </div>

            <div className="h-[320px] min-h-[260px]">
              {language ? (
                <CodeEditor
                  language={monacoLang(language.name)}
                  value={source}
                  onChange={(v) => langId != null && setSources((s) => ({ ...s, [langId]: v }))}
                />
              ) : null}
            </div>

            <div className="flex items-center gap-2 border-t border-line px-3 py-2.5">
              {runError ? <span className="font-mono text-[12px] text-bad">{runError}</span> : null}
              <div className="ml-auto flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={judging || locked}
                  onClick={() => judge("run")}
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="6 4 20 12 6 20 6 4" />
                  </svg>
                  Run
                </Button>
                <Button size="sm" disabled={judging || locked} onClick={() => judge("submit")}>
                  {locked ? (
                    <IconLock className="size-4" />
                  ) : (
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  )}
                  {locked ? "Locked" : "Submit"}
                </Button>
              </div>
            </div>
          </div>

          <ResultPanel submission={submission} judging={judging} />
        </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h2 className="mb-1.5 font-mono text-[12px] font-semibold uppercase tracking-wider text-ink-mute">
        {title}
      </h2>
      {children}
    </div>
  );
}

function SampleBox({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-ink-mute">{label}</div>
      <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-line bg-ground p-2.5 font-mono text-[12.5px] text-ink-dim">
        {value || "—"}
      </pre>
    </div>
  );
}
