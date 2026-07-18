"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  contentApi,
  type ExerciseAdmin,
  type ExerciseImportResult,
} from "@/lib/content";
import { apiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
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
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={downloadTemplate}>
            CSV template
          </Button>
          <Button
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={importCsv.isPending}
          >
            {importCsv.isPending ? "Importing…" : "Import CSV"}
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
        Compiler-free drills graded by matching the answer — these work with no Judge0
        deployed, and they slot into the roadmap exactly like coding questions.
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
    </div>
  );
}
