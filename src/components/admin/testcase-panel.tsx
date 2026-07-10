"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { contentApi } from "@/lib/content";
import { apiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Loading, ErrorState } from "@/components/ui/feedback";

export function TestcasePanel({ questionId }: { questionId: number }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["testcases", questionId],
    queryFn: () => contentApi.questionTestcases(questionId),
  });

  const [input, setInput] = useState("");
  const [expected, setExpected] = useState("");
  const [kind, setKind] = useState("hidden");
  const [points, setPoints] = useState("");
  const [replace, setReplace] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["testcases", questionId] });
    qc.invalidateQueries({ queryKey: ["admin-questions"] });
    qc.invalidateQueries({ queryKey: ["question", questionId] });
  }

  const addTestcase = useMutation({
    mutationFn: () =>
      contentApi.createTestcase({
        question: questionId,
        input,
        expected_output: expected,
        is_sample: kind === "sample",
        points: points ? Number(points) : null,
        sort_order: data?.length ?? 0,
      }),
    onSuccess: () => {
      setInput("");
      setExpected("");
      setPoints("");
      setErr(null);
      invalidate();
    },
    onError: (e) => setErr(apiErrorMessage(e, "Couldn't add test case.")),
  });

  const removeTestcase = useMutation({
    mutationFn: (id: number) => contentApi.deleteTestcase(id),
    onSuccess: invalidate,
  });

  const importCsv = useMutation({
    mutationFn: () => contentApi.importCsv(questionId, file!, replace),
    onSuccess: (res) => {
      setMsg(`Imported ${res.created} — ${res.samples} sample, ${res.hidden} hidden (total ${res.total}).`);
      setErr(null);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      invalidate();
    },
    onError: (e) => setErr(apiErrorMessage(e, "CSV import failed.")),
  });

  const samples = data?.filter((t) => t.is_sample).length ?? 0;
  const hidden = (data?.length ?? 0) - samples;

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[15px] font-bold">Test cases</h3>
        <span className="font-mono text-[12px] text-ink-mute">
          {data?.length ?? 0} added · no limit
        </span>
      </div>
      <p className="mt-1 text-[12.5px] text-ink-mute">
        {samples} sample · {hidden} hidden. Samples show to learners; hidden cases are used only
        for judging.
      </p>

      {/* CSV import */}
      <div className="mt-4 rounded-xl border border-dashed border-line-2 bg-ground p-4">
        <p className="text-[13px] font-medium">Bulk import from CSV</p>
        <p className="mt-0.5 font-mono text-[11.5px] text-ink-mute">
          columns: input, expected_output, is_sample, points
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="max-w-full text-[12px] text-ink-dim file:mr-3 file:rounded-md file:border file:border-line file:bg-surface file:px-3 file:py-1.5 file:text-ink hover:file:border-line-2"
          />
          <label className="flex items-center gap-1.5 font-mono text-[12px] text-ink-dim">
            <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} className="size-3.5 accent-[var(--ember)]" />
            replace existing
          </label>
          <Button size="sm" disabled={!file || importCsv.isPending} onClick={() => importCsv.mutate()}>
            {importCsv.isPending ? "Importing…" : "Import CSV"}
          </Button>
        </div>
        {msg ? <p className="mt-2 text-[12.5px] text-ok">{msg}</p> : null}
      </div>

      {/* manual add */}
      <div className="mt-4 grid grid-cols-[1fr_1fr_112px_84px_auto] gap-2 max-[560px]:grid-cols-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="input" className="font-mono text-[12.5px]" />
        <Input value={expected} onChange={(e) => setExpected(e.target.value)} placeholder="expected" className="font-mono text-[12.5px]" />
        <Select value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="hidden">hidden</option>
          <option value="sample">sample</option>
        </Select>
        <Input value={points} onChange={(e) => setPoints(e.target.value)} placeholder="pts" type="number" className="font-mono text-[12.5px]" />
        <Button size="sm" variant="ghost" disabled={addTestcase.isPending} onClick={() => addTestcase.mutate()}>
          Add
        </Button>
      </div>

      {err ? <p className="mt-2 text-[13px] text-bad">{err}</p> : null}

      {/* list */}
      <div className="mt-4">
        {isLoading ? (
          <Loading label="Loading test cases…" />
        ) : error ? (
          <ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} />
        ) : (data?.length ?? 0) === 0 ? (
          <p className="rounded-xl border border-dashed border-line-2 py-8 text-center text-[13px] text-ink-mute">
            No test cases yet — add one above or import a CSV.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full border-collapse font-mono text-[12px]">
              <thead>
                <tr className="border-b border-line text-left text-[10px] uppercase tracking-wider text-ink-mute">
                  <th className="px-3 py-2 font-semibold">#</th>
                  <th className="px-3 py-2 font-semibold">input</th>
                  <th className="px-3 py-2 font-semibold">expected</th>
                  <th className="px-3 py-2 font-semibold">type</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {data!.map((tc, i) => (
                  <tr key={tc.id} className="border-b border-line last:border-b-0">
                    <td className="px-3 py-2 text-ink-mute">{i + 1}</td>
                    <td className="max-w-[220px] truncate px-3 py-2 text-ink-dim">{tc.input || "—"}</td>
                    <td className="max-w-[220px] truncate px-3 py-2 text-ink-dim">{tc.expected_output || "—"}</td>
                    <td className={"px-3 py-2 " + (tc.is_sample ? "text-tan" : "text-ink-mute")}>
                      {tc.is_sample ? "sample" : "hidden"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeTestcase.mutate(tc.id)}
                        className="text-ink-mute hover:text-bad"
                        aria-label="Delete test case"
                      >
                        <svg viewBox="0 0 24 24" className="size-[15px]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
