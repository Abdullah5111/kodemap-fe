"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BackLink } from "@/components/ui/back-link";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
import {
  solveApi,
  isTerminal,
  monacoLang,
  initialSource,
  loadDraft,
  saveDraft,
  clearDraft,
  loadLangPref,
  saveLangPref,
  type Submission,
} from "@/lib/solve";
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
  const qc = useQueryClient();
  const { refresh: refreshUser } = useAuth();

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

  // Languages actually offered. For "complete the function" questions only
  // languages that have a stub can run, so don't offer the others (submitting
  // one would just error). Classic questions offer every allowed language.
  const langs = useMemo(() => {
    if (!q) return [];
    if (q.io_mode !== "function") return q.allowed_languages;
    const withStub = new Set((q.stubs ?? []).map((s) => s.language));
    return q.allowed_languages.filter((l) => withStub.has(l.id));
  }, [q]);

  // A function question that has no stubs yet can't be solved in any language.
  const funcUnready =
    !!q && q.kind !== "exercise" && q.io_mode === "function" && langs.length === 0;

  // Pick a default language + seed its editor once the question loads. Prefer the
  // language the learner last chose (across problems), falling back to the first.
  // Done during render (guarded by langId === null so it runs once), not in an effect.
  if (q && langId === null && langs.length > 0) {
    const pref = loadLangPref();
    const first = langs.find((l) => l.id === pref) ?? langs[0];
    setLangId(first.id);
    setSources((s) =>
      s[first.id] !== undefined
        ? s
        : { ...s, [first.id]: loadDraft(slug, first.id) ?? initialSource(q, first) },
    );
  }

  const language = useMemo(
    () => q?.allowed_languages.find((l) => l.id === langId) ?? null,
    [q, langId],
  );
  const source = langId != null ? sources[langId] ?? "" : "";

  function selectLang(id: number) {
    const lang = langs.find((l) => l.id === id);
    setLangId(id);
    saveLangPref(id);
    setSources((s) => ({
      ...s,
      [id]: s[id] ?? (q && lang ? loadDraft(slug, id) ?? initialSource(q, lang) : ""),
    }));
  }

  // Persist the current editor buffer so a refresh or navigation keeps the work.
  // Editing invalidates any shown verdict, so clear it — a stale "Failed" next to
  // freshly-changed code is confusing.
  function updateSource(v: string) {
    if (langId == null) return;
    setSources((s) => ({ ...s, [langId]: v }));
    saveDraft(slug, langId, v);
    if (submission || runError) {
      setSubmission(null);
      setRunError(null);
    }
  }

  // Discard the saved draft and restore the language's starter code.
  function resetToStarter() {
    if (q == null || langId == null) return;
    const lang = langs.find((l) => l.id === langId);
    if (!lang) return;
    clearDraft(slug, langId);
    setSources((s) => ({ ...s, [langId]: initialSource(q, lang) }));
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
      // Poll while the backend is still judging. Tolerate a transient network blip
      // (keep polling — the verdict is still cooking server-side) and stop with a
      // clear message if it never settles, rather than spinning forever.
      let guard = 0;
      let misses = 0;
      while (!isTerminal(sub.status) && guard < 60) {
        await sleep(1200);
        guard += 1;
        try {
          sub = await solveApi.getSubmission(sub.id);
          setSubmission(sub);
          misses = 0;
        } catch {
          if (++misses >= 5) throw new Error("Lost connection while judging.");
        }
      }
      if (!isTerminal(sub.status)) {
        setRunError("Judging is taking longer than usual. Please try again.");
      } else if (mode === "submit" && sub.status === "accepted") {
        void refetch();
        // Solving updates the streak/score server-side — refresh the cached user
        // and stats so the navbar and dashboard reflect it without a page reload.
        void refreshUser();
        qc.invalidateQueries({ queryKey: ["my-stats"] });
        qc.invalidateQueries({ queryKey: ["roadmap"] });
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
        <BackLink href="/roadmap">Roadmap</BackLink>
        <div className="mt-4">
          <ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} />
        </div>
      </div>
    );
  if (!q) return null;

  const locked = !q.is_unlocked;

  return (
    <div>
      <BackLink href={q.track_slug ? `/roadmap/${q.track_slug}` : "/roadmap"}>
        {q.track_title ?? "Roadmap"}
      </BackLink>

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

      {q.is_solved ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ok/40 bg-ok-soft px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ok text-white">
              <IconCheck className="size-[16px]" />
            </span>
            <div>
              <p className="text-[15px] font-bold text-ok">Solved</p>
              <p className="text-[12.5px] text-ink-dim">Nice work — this problem is complete.</p>
            </div>
          </div>
          {q.next_slug ? (
            <Link href={`/questions/${q.next_slug}`}>
              <Button size="sm">
                Next problem
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Button>
            </Link>
          ) : null}
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
                    <SampleBox
                      label={q.io_mode === "function" ? "arguments" : `input ${i + 1}`}
                      value={q.io_mode === "function" ? formatArgs(c.input) : c.input}
                    />
                    <SampleBox
                      label={q.io_mode === "function" ? "returns" : "expected"}
                      value={c.expected_output}
                    />
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
        ) : funcUnready ? (
          <div className="flex items-start gap-3 rounded-2xl border border-line border-l-[3px] border-l-warn bg-surface px-4 py-4">
            <svg viewBox="0 0 24 24" className="mt-0.5 size-[18px] shrink-0 text-warn" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            </svg>
            <div>
              <p className="text-[14px] font-semibold">This question isn&apos;t ready yet</p>
              <p className="text-[13px] text-ink-dim">
                It&apos;s a complete-the-function question, but no language starter has been
                set up for it. Please check back soon.
              </p>
            </div>
          </div>
        ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="flex items-center gap-2 border-b border-line bg-elevated px-3 py-2">
              <select
                value={langId ?? ""}
                onChange={(e) => selectLang(Number(e.target.value))}
                className="rounded-md border border-line bg-ground px-2.5 py-1.5 font-mono text-[12.5px] text-ink outline-none"
              >
                {langs.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} {l.version}
                  </option>
                ))}
              </select>
              <span className="ml-auto font-mono text-[11px] text-ink-mute">
                {language ? monacoLang(language.name) : ""}
              </span>
              <button
                type="button"
                onClick={resetToStarter}
                title="Discard your draft and restore the starter code"
                className="font-mono text-[11px] text-ink-mute transition-colors hover:text-ember"
              >
                Reset
              </button>
            </div>

            <div className="h-[320px] min-h-[260px]">
              {language ? (
                <CodeEditor
                  language={monacoLang(language.name)}
                  value={source}
                  onChange={updateSource}
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

          <ResultPanel
            submission={submission}
            judging={judging}
            functionMode={q.io_mode === "function"}
          />
        </div>
        )}
      </div>
    </div>
  );
}

// Function-mode inputs are a JSON array of the call arguments (e.g. "[3, 7, 5]" or
// "[[1,2,3], 9]"). Render them as a readable argument list rather than raw JSON.
function formatArgs(input: string): string {
  try {
    const parsed = JSON.parse(input);
    if (Array.isArray(parsed)) return parsed.map((a) => JSON.stringify(a)).join(", ");
  } catch {
    /* not JSON — show as-is */
  }
  return input;
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
