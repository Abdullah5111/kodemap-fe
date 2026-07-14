import { api } from "./api";
import type { Difficulty, Language, Paginated } from "./content";

export interface SampleTestcase {
  id: number;
  input: string;
  expected_output: string;
  sort_order: number;
}

export interface QuestionDetail {
  id: number;
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
export function starterCode(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("python")) return "import sys\n\ndef main():\n    data = sys.stdin.read().split()\n    # your solution\n\nmain()\n";
  if (n.includes("c++")) return "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // your solution\n    return 0;\n}\n";
  if (n.includes("java")) return "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // your solution\n    }\n}\n";
  if (n.includes("javascript") || n.includes("node")) return "const data = require('fs').readFileSync(0, 'utf8').split(/\\s+/);\n// your solution\n";
  return "";
}
