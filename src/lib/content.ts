import { api } from "./api";

// ----------------------------- types -----------------------------
export type Difficulty = "very_easy" | "easy" | "medium" | "hard" | "challenge";
export type TrackCategory = "beginner" | "dsa" | "competitive";

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Topic {
  id: number;
  name: string;
  slug: string;
}

export interface Language {
  id: number;
  name: string;
  judge0_language_id: number;
  version: string;
  is_active: boolean;
}

export interface TrackSummary {
  id: number;
  title: string;
  slug: string;
  category: TrackCategory;
  description: string;
  sort_order: number;
  module_count: number;
  question_count: number;
}

export interface RoadmapLesson {
  id: number;
  title: string;
  description: string;
  sort_order: number;
  question_count: number;
  required_count: number;
}

export interface RoadmapModule {
  id: number;
  title: string;
  description: string;
  sort_order: number;
  lessons: RoadmapLesson[];
}

export interface RoadmapTrack {
  id: number;
  title: string;
  slug: string;
  category: TrackCategory;
  description: string;
  sort_order: number;
  modules: RoadmapModule[];
}

export interface QuestionListItem {
  id: number;
  title: string;
  slug: string;
  difficulty: Difficulty;
  score: number;
  topic_name: string | null;
  is_active: boolean;
  testcase_count: number;
  created_at: string;
}

export interface QuestionAdmin {
  id: number;
  title: string;
  slug: string;
  statement: string;
  input_format: string;
  output_format: string;
  constraints: string;
  difficulty: Difficulty;
  score: number;
  topic: number | null;
  time_limit_ms: number;
  memory_limit_kb: number;
  allowed_languages: number[];
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  testcase_count: number;
  sample_count: number;
  hidden_count: number;
}

export type QuestionInput = Partial<
  Pick<
    QuestionAdmin,
    | "title"
    | "statement"
    | "input_format"
    | "output_format"
    | "constraints"
    | "difficulty"
    | "score"
    | "topic"
    | "time_limit_ms"
    | "memory_limit_kb"
    | "allowed_languages"
    | "is_active"
  >
>;

export interface Testcase {
  id: number;
  question: number;
  input: string;
  expected_output: string;
  is_sample: boolean;
  points: number | null;
  sort_order: number;
}

export interface CsvImportResult {
  created: number;
  samples: number;
  hidden: number;
  total: number;
}

export const DIFFICULTY_META: Record<Difficulty, { label: string; score: number; cls: string }> = {
  very_easy: { label: "Very Easy", score: 5, cls: "text-d-vezy bg-d-vezy/12" },
  easy: { label: "Easy", score: 10, cls: "text-d-easy bg-d-easy/12" },
  medium: { label: "Medium", score: 20, cls: "text-d-med bg-d-med/12" },
  hard: { label: "Hard", score: 40, cls: "text-d-hard bg-d-hard/12" },
  challenge: { label: "Challenge", score: 60, cls: "text-d-chal bg-d-chal/12" },
};

export const DIFFICULTY_ORDER: Difficulty[] = ["very_easy", "easy", "medium", "hard", "challenge"];

// ----------------------------- API -----------------------------
export const contentApi = {
  // learner reads
  roadmap: () => api.get<TrackSummary[]>("/roadmap").then((r) => r.data),
  track: (slug: string) => api.get<RoadmapTrack>(`/tracks/${slug}`).then((r) => r.data),

  languages: () =>
    api.get<Paginated<Language>>("/languages/").then((r) => r.data.results),
  topics: () =>
    api.get<Paginated<Topic>>("/admin/topics/").then((r) => r.data.results),

  // admin questions
  listQuestions: (params: Record<string, string | number | undefined> = {}) =>
    api
      .get<Paginated<QuestionListItem>>("/admin/questions/", { params })
      .then((r) => r.data),
  getQuestion: (id: number) =>
    api.get<QuestionAdmin>(`/admin/questions/${id}/`).then((r) => r.data),
  createQuestion: (payload: QuestionInput) =>
    api.post<QuestionAdmin>("/admin/questions/", payload).then((r) => r.data),
  updateQuestion: (id: number, payload: QuestionInput) =>
    api.patch<QuestionAdmin>(`/admin/questions/${id}/`, payload).then((r) => r.data),
  deleteQuestion: (id: number) => api.delete(`/admin/questions/${id}/`),

  // test cases
  questionTestcases: (id: number) =>
    api.get<Testcase[]>(`/admin/questions/${id}/testcases/`).then((r) => r.data),
  createTestcase: (payload: Partial<Testcase>) =>
    api.post<Testcase>("/admin/testcases/", payload).then((r) => r.data),
  updateTestcase: (id: number, payload: Partial<Testcase>) =>
    api.patch<Testcase>(`/admin/testcases/${id}/`, payload).then((r) => r.data),
  deleteTestcase: (id: number) => api.delete(`/admin/testcases/${id}/`),
  importCsv: (questionId: number, file: File, replace: boolean) => {
    const fd = new FormData();
    fd.append("file", file);
    if (replace) fd.append("replace", "true");
    return api
      .post<CsvImportResult>(`/admin/questions/${questionId}/import-csv/`, fd)
      .then((r) => r.data);
  },
};
