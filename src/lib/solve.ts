import { api } from "./api";
import type { Difficulty, Language, Paginated } from "./content";

export interface SampleTestcase {
  id: number;
  input: string;
  expected_output: string;
  sort_order: number;
}

export type QuestionKind = "code" | "exercise";
export type IOMode = "stdin" | "function";

/** Learner-facing per-language starter stub (never the hidden harness). */
export interface CodeStub {
  language: number;
  starter_code: string;
}
export type ExerciseType = "predict_output" | "fill_blank";

export interface ExerciseBlank {
  id: number;
  label: string;
  sort_order: number;
}

/** Learner view of an exercise — never carries the accepted answers. */
export interface ExerciseDetail {
  id: number;
  type: ExerciseType;
  code: string;
  language_hint: string;
  hint: string;
  blanks: ExerciseBlank[];
}

export interface ExerciseBlankResult {
  sort_order: number;
  label: string;
  is_correct: boolean;
}

export interface ExerciseAttempt {
  submission_id: number;
  status: SubmissionStatus;
  is_correct: boolean;
  passed_count: number;
  total_count: number;
  score_awarded: number;
  results: ExerciseBlankResult[];
  /** Only present once correct — otherwise it would be the answer key. */
  explanation: string;
  hint: string;
}

export interface QuestionDetail {
  id: number;
  kind: QuestionKind;
  io_mode: IOMode;
  title: string;
  slug: string;
  statement: string;
  input_format: string;
  output_format: string;
  constraints: string;
  difficulty: Difficulty;
  score: number;
  topic_name: string | null;
  time_limit_ms: number;
  memory_limit_kb: number;
  allowed_languages: Language[];
  sample_testcases: SampleTestcase[];
  is_solved: boolean;
  is_unlocked: boolean;
  exercise: ExerciseDetail | null;
  /** Present only for "complete the function" (io_mode === "function") questions. */
  stubs: CodeStub[];
}

export type SubmissionStatus =
  | "pending"
  | "in_queue"
  | "processing"
  | "accepted"
  | "wrong_answer"
  | "time_limit_exceeded"
  | "compilation_error"
  | "runtime_error"
  | "internal_error";

export interface TestResult {
  index: number;
  status: SubmissionStatus;
  is_correct: boolean;
  time_ms: number | null;
  memory_kb: number | null;
  // revealed on run only
  stdout?: string;
  stderr?: string;
  compile_output?: string;
  input?: string | null;
  expected_output?: string | null;
}

export interface Submission {
  id: number;
  question_slug: string;
  question_title: string;
  language_name: string;
  mode: "run" | "submit";
  status: SubmissionStatus;
  passed_count: number;
  total_count: number;
  score_awarded: number;
  execution_time_ms: number | null;
  memory_used_kb: number | null;
  error_message: string;
  created_at: string;
  results: TestResult[];
}

export interface SubmissionListItem {
  id: number;
  status: SubmissionStatus;
  mode: "run" | "submit";
  language_name: string;
  passed_count: number;
  total_count: number;
  score_awarded: number;
  execution_time_ms: number | null;
  created_at: string;
}

export const TERMINAL_STATUSES: SubmissionStatus[] = [
  "accepted",
  "wrong_answer",
  "time_limit_exceeded",
  "compilation_error",
  "runtime_error",
  "internal_error",
];

export const STATUS_META: Record<
  SubmissionStatus,
  { label: string; tone: "ok" | "bad" | "warn" | "run" }
> = {
  pending: { label: "Pending", tone: "run" },
  in_queue: { label: "In Queue", tone: "run" },
  processing: { label: "Judging…", tone: "run" },
  accepted: { label: "Accepted", tone: "ok" },
  wrong_answer: { label: "Wrong Answer", tone: "bad" },
  time_limit_exceeded: { label: "Time Limit Exceeded", tone: "warn" },
  compilation_error: { label: "Compilation Error", tone: "bad" },
  runtime_error: { label: "Runtime Error", tone: "bad" },
  internal_error: { label: "Internal Error", tone: "bad" },
};

export function isTerminal(status: SubmissionStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/** Never let an unrecognized status crash the UI: fall back to a neutral label
    instead of reading `.tone`/`.label` off `undefined`. */
export function statusMeta(status: string) {
  return (
    STATUS_META[status as SubmissionStatus] ?? { label: status || "Unknown", tone: "run" as const }
  );
}

interface RunInput {
  language_id: number;
  source_code: string;
}

export const solveApi = {
  question: (slug: string) =>
    api.get<QuestionDetail>(`/questions/${slug}`).then((r) => r.data),
  run: (slug: string, body: RunInput) =>
    api.post<Submission>(`/questions/${slug}/run`, body).then((r) => r.data),
  submit: (slug: string, body: RunInput) =>
    api.post<Submission>(`/questions/${slug}/submit`, body).then((r) => r.data),
  getSubmission: (id: number) =>
    api.get<Submission>(`/submissions/${id}`).then((r) => r.data),
  attemptExercise: (slug: string, answers: string[]) =>
    api
      .post<ExerciseAttempt>(`/questions/${slug}/exercise`, { answers })
      .then((r) => r.data),
  history: (slug: string) =>
    api
      .get<Paginated<SubmissionListItem>>("/submissions", { params: { question: slug } })
      .then((r) => r.data.results),
};

// Monaco language id per Kodemap language name.
export function monacoLang(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("c++")) return "cpp";
  if (n.includes("python")) return "python";
  if (n.includes("javascript") || n.includes("node")) return "javascript";
  if (n.includes("java")) return "java";
  if (n === "c") return "c";
  return "plaintext";
}

// A tiny starter template per language so the editor isn't empty.
// --- editor draft persistence (per question + language) --------------------
const DRAFT_PREFIX = "kodemap:draft:";
const draftKey = (slug: string, langId: number) => `${DRAFT_PREFIX}${slug}:${langId}`;

export function loadDraft(slug: string, langId: number): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(draftKey(slug, langId));
  } catch {
    return null;
  }
}

export function saveDraft(slug: string, langId: number, code: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(draftKey(slug, langId), code);
  } catch {
    /* quota or disabled storage — drafting is best-effort */
  }
}

export function clearDraft(slug: string, langId: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(draftKey(slug, langId));
  } catch {
    /* ignore */
  }
}

/** Seed code for the editor: the question's per-language function stub when it's
    a "complete the function" question, otherwise the generic language starter. */
export function initialSource(q: QuestionDetail, lang: Language): string {
  if (q.io_mode === "function") {
    const stub = q.stubs?.find((s) => s.language === lang.id);
    if (stub?.starter_code) return stub.starter_code;
  }
  return starterCode(lang.name);
}

export function starterCode(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("python")) return "import sys\n\ndef main():\n    data = sys.stdin.read().split()\n    # your solution\n\nmain()\n";
  if (n.includes("c++")) return "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // your solution\n    return 0;\n}\n";
  if (n.includes("java")) return "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // your solution\n    }\n}\n";
  if (n.includes("javascript") || n.includes("node")) return "const data = require('fs').readFileSync(0, 'utf8').split(/\\s+/);\n// your solution\n";
  return "";
}
