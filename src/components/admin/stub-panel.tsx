"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { contentApi, type Language, type QuestionCodeStub } from "@/lib/content";
import { apiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { Loading } from "@/components/ui/feedback";

/** Append-safe skeletons: the function/class is defined first (learner code),
    the harness runs after it. The harness reads the test-case stdin, calls the
    learner's function, and prints the return. Authors adapt to their signature. */
const TEMPLATES: Record<string, { starter: string; harness: string }> = {
  python: {
    starter: "def solve(nums):\n    # Write your solution and return the result.\n    pass\n",
    harness:
      // separators=(",", ":") => compact JSON matching JS JSON.stringify, so the
      // same expected_output works whether the learner picks Python or JS.
      'import sys, json\n_data = json.loads(sys.stdin.read() or "null")\n_args = _data if isinstance(_data, list) else [_data]\nprint(json.dumps(solve(*_args), separators=(",", ":")))\n',
  },
  javascript: {
    starter: "function solve(nums) {\n  // Write your solution and return the result.\n}\n",
    harness:
      "const _data = JSON.parse(require('fs').readFileSync(0, 'utf8') || 'null');\nconst _args = Array.isArray(_data) ? _data : [_data];\nconsole.log(JSON.stringify(solve(..._args)));\n",
  },
  cpp: {
    starter:
      "#include <bits/stdc++.h>\nusing namespace std;\n\n// Complete this function and return the result.\nint solve(int a, int b) {\n    return 0;\n}\n",
    harness:
      "// Hidden harness: read the test-case input, call solve(...), print the return.\n// Adapt the parsing to your function's signature.\nint main() {\n    int a, b;\n    cin >> a >> b;\n    cout << solve(a, b) << \"\\n\";\n    return 0;\n}\n",
  },
  java: {
    starter:
      "import java.util.*;\n\nclass Solution {\n    // Complete this method and return the result.\n    static int solve(int a, int b) {\n        return 0;\n    }\n}\n",
    harness:
      "// Hidden harness: reads stdin, calls Solution.solve(...), prints the return.\n// Uses fully-qualified names so it stays valid appended after the class.\npublic class Main {\n    public static void main(String[] args) {\n        java.util.Scanner sc = new java.util.Scanner(System.in);\n        int a = sc.nextInt(), b = sc.nextInt();\n        System.out.println(Solution.solve(a, b));\n    }\n}\n",
  },
};

function templateFor(name: string): { starter: string; harness: string } | null {
  const n = name.toLowerCase();
  if (n.includes("python")) return TEMPLATES.python;
  if (n.includes("javascript") || n.includes("node")) return TEMPLATES.javascript;
  if (n.includes("c++") || n.includes("cpp")) return TEMPLATES.cpp;
  if (n.includes("java")) return TEMPLATES.java;
  return null;
}

export function StubPanel({
  questionId,
  allowedLanguageIds,
}: {
  questionId: number;
  allowedLanguageIds: number[];
}) {
  const { data: languages } = useQuery({ queryKey: ["languages"], queryFn: contentApi.languages });
  const { data: stubs, isLoading } = useQuery({
    queryKey: ["stubs", questionId],
    queryFn: () => contentApi.questionStubs(questionId),
  });

  const langs = (languages ?? []).filter(
    (l) =>
      l.is_active &&
      (allowedLanguageIds.length === 0 || allowedLanguageIds.includes(l.id)),
  );

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <h3 className="text-[15px] font-bold">Function stubs & harnesses</h3>
      <p className="mt-1 text-[12.5px] text-ink-dim">
        For each language, the <span className="text-tan">starter</span> is shown in the
        learner&apos;s editor; the <span className="text-ember">harness</span> is hidden and
        appended to their code at run time (it reads the test-case input as the arguments and
        prints the return). Test cases: <span className="font-mono">input</span> = the arguments,{" "}
        <span className="font-mono">expected</span> = the return value.
      </p>

      {isLoading ? (
        <Loading label="Loading stubs…" />
      ) : (
        <>
          {(() => {
            const configuredIds = new Set(
              (stubs ?? []).filter((s) => (s.harness || "").trim()).map((s) => s.language),
            );
            const missing = langs.filter((l) => !configuredIds.has(l.id));
            if (langs.length === 0) return null;
            if (missing.length === 0)
              return (
                <p className="mt-3 rounded-lg border border-ok/40 bg-ok-soft px-3 py-2 text-[12.5px] text-ok">
                  All {langs.length} allowed language{langs.length === 1 ? "" : "s"} have a stub —
                  learners can solve this in any of them.
                </p>
              );
            return (
              <p className="mt-3 rounded-lg border border-warn/40 bg-warn-soft px-3 py-2 text-[12.5px] text-warn">
                No stub yet for {missing.map((l) => l.name).join(", ")} — learners can&apos;t
                solve this question in {missing.length === 1 ? "that language" : "those languages"}.
                Add {missing.length === 1 ? "it" : "them"} below or remove the language from the
                question.
              </p>
            );
          })()}
        <div className="mt-4 flex flex-col gap-3">
          {langs.map((l) => (
            <StubEditor
              key={l.id}
              questionId={questionId}
              language={l}
              stub={stubs?.find((s) => s.language === l.id)}
            />
          ))}
          {langs.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line-2 py-6 text-center text-[13px] text-ink-mute">
              No active languages to author stubs for.
            </p>
          ) : null}
        </div>
        </>
      )}
    </div>
  );
}

function StubEditor({
  questionId,
  language,
  stub,
}: {
  questionId: number;
  language: Language;
  stub?: QuestionCodeStub;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [starter, setStarter] = useState(stub?.starter_code ?? "");
  const [harness, setHarness] = useState(stub?.harness ?? "");
  const [err, setErr] = useState<string | null>(null);

  const configured = !!stub;

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["stubs", questionId] });
  }

  const save = useMutation({
    mutationFn: () =>
      stub
        ? contentApi.updateStub(stub.id, { starter_code: starter, harness })
        : contentApi.createStub({
            question: questionId,
            language: language.id,
            starter_code: starter,
            harness,
          }),
    onSuccess: () => {
      setErr(null);
      invalidate();
    },
    onError: (e) => setErr(apiErrorMessage(e, "Couldn't save the stub.")),
  });

  const remove = useMutation({
    mutationFn: () => contentApi.deleteStub(stub!.id),
    onSuccess: () => {
      setStarter("");
      setHarness("");
      invalidate();
    },
    onError: (e) => setErr(apiErrorMessage(e, "Couldn't delete the stub.")),
  });

  function loadTemplate() {
    const t = templateFor(language.name);
    if (!t) return;
    setStarter(t.starter);
    setHarness(t.harness);
  }

  return (
    <div className="rounded-xl border border-line bg-ground">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left"
      >
        <span
          className={
            "size-1.5 rounded-full " + (configured ? "bg-ok" : "bg-line-2")
          }
        />
        <span className="font-mono text-[13px] font-semibold">{language.name}</span>
        <span className="font-mono text-[11px] text-ink-mute">
          {configured ? "configured" : "not set"}
        </span>
        <svg
          viewBox="0 0 24 24"
          className={"ml-auto size-4 text-ink-mute transition-transform " + (open ? "rotate-180" : "")}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div className="flex flex-col gap-3 border-t border-line px-4 py-3.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-tan">
              Starter — learner sees this
            </span>
            <Button variant="ghost" size="sm" onClick={loadTemplate}>
              Load {language.name} template
            </Button>
          </div>
          <Textarea
            value={starter}
            onChange={(e) => setStarter(e.target.value)}
            className="min-h-[120px] font-mono text-[12.5px]"
            placeholder="def solve(...):\n    pass"
          />

          <span className="font-mono text-[11px] uppercase tracking-wider text-ember">
            Hidden harness — appended to the learner&apos;s code
          </span>
          <Textarea
            value={harness}
            onChange={(e) => setHarness(e.target.value)}
            className="min-h-[120px] font-mono text-[12.5px]"
            placeholder="read stdin → call the function → print the return"
          />

          {err ? <p className="text-[12.5px] text-bad">{err}</p> : null}

          <div className="flex items-center gap-2">
            {configured ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={remove.isPending}
                onClick={() => remove.mutate()}
              >
                Remove
              </Button>
            ) : null}
            <Button
              size="sm"
              className="ml-auto"
              disabled={save.isPending}
              onClick={() => save.mutate()}
            >
              {save.isPending ? "Saving…" : configured ? "Save" : "Add stub"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
