"use client";

import { useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  contentApi,
  DIFFICULTY_ORDER,
  DIFFICULTY_META,
  type Difficulty,
  type ExerciseAdmin,
  type ExerciseImportResult,
  type ExerciseType,
} from "@/lib/content";
import { apiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Loading, ErrorState, EmptyState } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";

const TYPE_META: Record<string, { label: string; cls: string }> = {
  predict_output: { label: "Predict output", cls: "text-d-vezy bg-d-vezy/12" },
  fill_blank: { label: "Fill in the blank", cls: "text-d-easy bg-d-easy/12" },
};

const SAMPLE_CSV = `type,title,statement,code,answers,explanation,hint
predict_output,Counting up,What does this print?,"for i in range(3):
    print(i)","0
1
2",range(3) yields 0 1 2 — it stops before 3.,Start at zero.
fill_blank,Complete the loop,Fill in the gaps to print 1 to 5.,"for i in ____(1, ____):
    print(i)",range||xrange;;6,range(1 6) stops before 6 so it prints 1-5.,The stop value is exclusive.`;

export default function AdminExercisesPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ExerciseImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const { data, isLoading, error: loadError, refetch } = useQuery({
    queryKey: ["admin-exercises"],
    queryFn: contentApi.listExercises,
  });

  const importCsv = useMutation({
    mutationFn: (file: File) => contentApi.importExercisesCsv(file),
    onSuccess: (res) => {
      setResult(res);
      setError(null);
      qc.invalidateQueries({ queryKey: ["admin-exercises"] });
      qc.invalidateQueries({ queryKey: ["admin-questions"] });
    },
    onError: (e) => {
      setResult(null);
      setError(apiErrorMessage(e, "Couldn't import that CSV."));
    },
  });

  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob([SAMPLE_CSV], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "kodemap-exercises-template.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const rows = data?.results ?? [];

  return (
    <div>
      <p className="font-mono text-[12px] text-ink-mute">admin / content / exercises</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[clamp(20px,3vw,25px)] font-bold tracking-tight">Exercises</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={downloadTemplate}>
            CSV template
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={importCsv.isPending}
          >
            {importCsv.isPending ? "Importing…" : "Import CSV"}
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New exercise
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) importCsv.mutate(f);
            }}
          />
        </div>
      </div>
      <p className="mt-2 max-w-[68ch] text-sm text-ink-dim">
        Compiler-free drills graded by matching the answer.
      </p>

      {/* authoring guide */}
      <div className="mt-4 rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-[14px] font-bold">CSV format</h2>
        <div className="mt-2 flex flex-col gap-1.5 text-[13px] text-ink-dim">
          <p>
            <code className="font-mono text-tan">type</code> —{" "}
            <code className="font-mono">predict_output</code> or{" "}
            <code className="font-mono">fill_blank</code>
          </p>
          <p>
            <code className="font-mono text-tan">code</code> — the snippet; mark each gap
            with <code className="font-mono">____</code> (four underscores)
          </p>
          <p>
            <code className="font-mono text-tan">answers</code> — use{" "}
            <code className="font-mono">||</code> between alternatives for one blank, and{" "}
            <code className="font-mono">;;</code> between blanks. Example:{" "}
            <code className="font-mono text-ember">range||xrange;;6</code>
          </p>
          <p className="text-ink-mute">
            Optional: <code className="font-mono">difficulty</code>,{" "}
            <code className="font-mono">explanation</code>,{" "}
            <code className="font-mono">hint</code>,{" "}
            <code className="font-mono">language_hint</code>,{" "}
            <code className="font-mono">lesson_id</code> (attaches it into the roadmap).
          </p>
        </div>
        <p className="mt-3 rounded-lg border border-line bg-ground px-3 py-2 font-mono text-[11.5px] text-ink-mute">
          List real variants in <span className="text-tan">answers</span> rather than
          relying on loose matching — a matcher that is too forgiving marks genuine
          mistakes correct.
        </p>
      </div>

      {/* import outcome */}
      {error ? (
        <p className="mt-4 rounded-[9px] border border-bad/40 bg-bad-soft px-3 py-2 text-[13px] text-bad">
          {error}
        </p>
      ) : null}
      {result ? (
        <div className="mt-4 rounded-2xl border border-line border-l-[3px] border-l-ok bg-surface p-4">
          <p className="text-[14px] font-semibold text-ok">
            Imported {result.created} exercise{result.created === 1 ? "" : "s"}
          </p>
          {result.errors.length > 0 ? (
            <div className="mt-2">
              <p className="text-[13px] text-bad">
                {result.errors.length} row{result.errors.length === 1 ? "" : "s"} skipped:
              </p>
              <ul className="mt-1 flex flex-col gap-0.5">
                {result.errors.map((e) => (
                  <li key={e.row} className="font-mono text-[12px] text-ink-dim">
                    row {e.row}: {e.error}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* list */}
      <div className="mt-4">
        {isLoading ? (
          <Loading label="Loading exercises…" />
        ) : loadError ? (
          <ErrorState message={apiErrorMessage(loadError)} onRetry={() => refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No exercises yet"
            description="Download the template, fill it in, and import."
            action={
              <Button size="sm" onClick={downloadTemplate}>
                CSV template
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-wider text-ink-mute">
                  <th className="px-3 py-2.5 font-semibold">Type</th>
                  <th className="px-3 py-2.5 font-semibold">Snippet</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Blanks</th>
                  <th className="px-3 py-2.5 font-semibold">Explanation</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((ex: ExerciseAdmin) => {
                  const meta = TYPE_META[ex.type] ?? {
                    label: ex.type,
                    cls: "text-ink-dim bg-elevated",
                  };
                  return (
                    <tr key={ex.id} className="border-b border-line last:border-b-0 hover:bg-ground">
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold",
                            meta.cls,
                          )}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="max-w-[380px] px-3 py-2.5">
                        <pre className="truncate font-mono text-[12px] text-ink-dim">
                          {ex.code.split("\n")[0]}
                          {ex.code.includes("\n") ? " …" : ""}
                        </pre>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-[13px] tabular-nums">
                        {ex.blanks.length}
                      </td>
                      <td className="max-w-[280px] truncate px-3 py-2.5 text-[12.5px] text-ink-mute">
                        {ex.explanation || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd ? (
        <AddExerciseModal
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false);
            qc.invalidateQueries({ queryKey: ["admin-exercises"] });
            qc.invalidateQueries({ queryKey: ["admin-questions"] });
          }}
        />
      ) : null}
    </div>
  );
}

// --- manual authoring modal -------------------------------------------------
function AddExerciseModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [type, setType] = useState<ExerciseType>("predict_output");
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("very_easy");
  const [statement, setStatement] = useState("");
  const [code, setCode] = useState("");
  const [languageHint, setLanguageHint] = useState("python");
  const [explanation, setExplanation] = useState("");
  const [hint, setHint] = useState("");
  // predict_output: one expected-output value (alternatives via new lines)
  const [expected, setExpected] = useState("");
  // fill_blank: one "alternatives" string per ____ gap (alternatives via |)
  const [blankAnswers, setBlankAnswers] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const gaps = useMemo(() => (code.match(/____/g) || []).length, [code]);

  // keep one answer input per detected gap
  const blanks = useMemo(() => {
    const next = Array.from({ length: gaps }, (_, i) => blankAnswers[i] ?? "");
    return next;
  }, [gaps, blankAnswers]);

  function setBlank(i: number, value: string) {
    setBlankAnswers((prev) => {
      const next = Array.from({ length: gaps }, (_, k) => prev[k] ?? "");
      next[i] = value;
      return next;
    });
  }

  const create = useMutation({
    mutationFn: () => {
      const payloadBlanks =
        type === "fill_blank"
          ? blanks.map((b) => ({
              accepted: b.split("|").map((a) => a.trim()).filter(Boolean),
            }))
          : [
              {
                accepted: expected
                  .split("\n")
                  .map((a) => a.trim())
                  .filter(Boolean),
              },
            ];
      return contentApi.authorExercise({
        type,
        title,
        code,
        blanks: payloadBlanks,
        difficulty,
        statement,
        explanation,
        hint,
        language_hint: languageHint,
      });
    },
    onSuccess: onCreated,
    onError: (e) => setErr(apiErrorMessage(e, "Couldn't create the exercise.")),
  });

  function submit() {
    setErr(null);
    if (!title.trim()) return setErr("Title is required.");
    if (!code.trim()) return setErr("Code snippet is required.");
    if (type === "fill_blank") {
      if (gaps === 0)
        return setErr("Add at least one ____ marker in the code for a fill-in-the-blank.");
      if (blanks.some((b) => b.split("|").every((a) => !a.trim())))
        return setErr("Every blank needs at least one accepted answer.");
    } else if (!expected.trim()) {
      return setErr("Enter the expected output.");
    }
    create.mutate();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-[640px] rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow)]">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-bold">New exercise</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-ink-mute hover:bg-ground hover:text-ink"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3.5">
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Type" htmlFor="ex-type">
              <Select
                id="ex-type"
                value={type}
                onChange={(e) => setType(e.target.value as ExerciseType)}
              >
                <option value="predict_output">Predict output</option>
                <option value="fill_blank">Fill in the blank</option>
              </Select>
            </Field>
            <Field label="Difficulty" htmlFor="ex-diff">
              <Select
                id="ex-diff"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              >
                {DIFFICULTY_ORDER.map((d) => (
                  <option key={d} value={d}>
                    {DIFFICULTY_META[d].label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Title" htmlFor="ex-title">
            <Input
              id="ex-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Counting up"
            />
          </Field>

          <Field label="Statement" htmlFor="ex-stmt" hint="The prompt shown above the snippet.">
            <Textarea
              id="ex-stmt"
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              placeholder="What does this print?"
            />
          </Field>

          <Field
            label="Code snippet"
            htmlFor="ex-code"
            hint={
              type === "fill_blank"
                ? "Mark each gap with ____ (four underscores)."
                : "The snippet the learner reads."
            }
          >
            <Textarea
              id="ex-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="min-h-[120px] font-mono text-[13px]"
              placeholder={
                type === "fill_blank"
                  ? "for i in ____(1, ____):\n    print(i)"
                  : "for i in range(3):\n    print(i)"
              }
            />
          </Field>

          {type === "fill_blank" ? (
            gaps === 0 ? (
              <p className="rounded-lg border border-warn/40 bg-warn-soft px-3 py-2 text-[12.5px] text-warn">
                Add <code className="font-mono">____</code> markers in the code to create blanks.
              </p>
            ) : (
              <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-ground p-3.5">
                <p className="font-mono text-[11.5px] text-ink-mute">
                  {gaps} blank{gaps === 1 ? "" : "s"} detected · separate alternatives with{" "}
                  <code className="text-ember">|</code>
                </p>
                {blanks.map((b, i) => (
                  <Field key={i} label={`Blank ${i + 1} — accepted answers`}>
                    <Input
                      value={b}
                      onChange={(e) => setBlank(i, e.target.value)}
                      placeholder="range|xrange"
                      className="font-mono text-[13px]"
                    />
                  </Field>
                ))}
              </div>
            )
          ) : (
            <Field
              label="Expected output"
              htmlFor="ex-expected"
              hint="Exactly what the snippet prints. One acceptable variant per line."
            >
              <Textarea
                id="ex-expected"
                value={expected}
                onChange={(e) => setExpected(e.target.value)}
                className="font-mono text-[13px]"
                placeholder={"0\n1\n2"}
              />
            </Field>
          )}

          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Language" htmlFor="ex-lang" hint="For syntax highlighting.">
              <Input
                id="ex-lang"
                value={languageHint}
                onChange={(e) => setLanguageHint(e.target.value)}
                placeholder="python"
              />
            </Field>
            <Field label="Hint" htmlFor="ex-hint" hint="Shown while the answer is wrong.">
              <Input
                id="ex-hint"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="Start at zero."
              />
            </Field>
          </div>

          <Field label="Explanation" htmlFor="ex-expl" hint="Revealed once the learner is correct.">
            <Textarea
              id="ex-expl"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="range(3) yields 0 1 2 — it stops before 3."
            />
          </Field>

          {err ? <p className="text-[13px] text-bad">{err}</p> : null}

          <div className="flex justify-end gap-2 border-t border-line pt-3.5">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" disabled={create.isPending} onClick={submit}>
              {create.isPending ? "Creating…" : "Create exercise"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
