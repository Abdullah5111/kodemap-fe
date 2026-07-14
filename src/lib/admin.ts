import { api } from "./api";
import type { Paginated, Difficulty } from "./content";
import type { SubmissionStatus } from "./solve";
import type { Role, EducationLevel } from "./types";

// ------------------------------- overview -------------------------------
export interface AdminTotals {
  users: number;
  learners: number;
  staff: number;
  questions: number;
  active_questions: number;
  submissions: number;
  solved_total: number;
}

export interface ActivityPoint {
  date: string;
  submissions: number;
  accepted: number;
}

export interface TopQuestion {
  id: number;
  title: string;
  slug: string;
  difficulty: Difficulty;
  attempts: number;
  solved: number;
}

export interface RecentSignup {
  id: number;
  username: string;
  full_name: string;
  institution: string;
  role: Role;
  date_joined: string;
}

export interface AdminOverview {
  totals: AdminTotals;
  verdicts: Partial<Record<SubmissionStatus, number>>;
  activity: ActivityPoint[];
  top_questions: TopQuestion[];
  recent_signups: RecentSignup[];
}

// --------------------------------- users --------------------------------
export interface AdminUser {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: Role;
  institution: string;
  education_level: EducationLevel | "";
  streak_count: number;
  is_active: boolean;
  is_email_verified: boolean;
  date_joined: string;
  score: number;
  solved: number;
  batch: number | null;
  batch_name: string | null;
}

// -------------------------------- batches -------------------------------
export interface Batch {
  id: number;
  name: string;
  code: string;
  institution: string;
  start_year: number | null;
  description: string;
  supervisor: number | null;
  supervisor_name: string | null;
  is_active: boolean;
  created_at: string;
  member_count: number;
}

export type BatchInput = Partial<
  Pick<Batch, "name" | "institution" | "start_year" | "description" | "supervisor" | "is_active">
>;

export interface AdminUserSubmission {
  id: number;
  question_title: string;
  question_slug: string;
  status: SubmissionStatus;
  score_awarded: number;
  created_at: string;
}

export interface AdminUserDetail extends AdminUser {
  field_of_study: string;
  graduation_year: number | null;
  current_year: string;
  github_url: string;
  bio: string;
  last_active_date: string | null;
  rank: number | null;
  submissions_total: number;
  recent_submissions: AdminUserSubmission[];
}

// ------------------------------ submissions -----------------------------
export interface AdminSubmission {
  id: number;
  user_id: number;
  username: string;
  question_title: string;
  question_slug: string;
  language_name: string;
  mode: "run" | "submit";
  status: SubmissionStatus;
  passed_count: number;
  total_count: number;
  score_awarded: number;
  execution_time_ms: number | null;
  memory_used_kb: number | null;
  created_at: string;
}

// -------------------------------- reports -------------------------------
export type ReportName = "learners" | "questions";

export interface LearnerReportRow {
  user_id: number;
  username: string;
  full_name: string;
  email: string;
  batch: string;
  institution: string;
  score: number;
  solved: number;
  attempted: number;
  submissions: number;
  accepted: number;
  accuracy: number;
  completion: number;
  streak: number;
  last_active: string;
}

export interface QuestionReportRow {
  question_id: number;
  title: string;
  slug: string;
  difficulty: Difficulty;
  score: number;
  attempts: number;
  attempters: number;
  solvers: number;
  solve_rate: number;
  avg_attempts: number;
}

export interface ReportResponse<T> {
  report: ReportName;
  columns: string[];
  count: number;
  results: T[];
  batches: { id: number; name: string }[];
}

export const adminApi = {
  overview: () => api.get<AdminOverview>("/admin/overview").then((r) => r.data),

  report: <T>(name: ReportName, batch?: string) =>
    api
      .get<ReportResponse<T>>(`/admin/reports/${name}`, {
        params: batch ? { batch } : undefined,
      })
      .then((r) => r.data),

  /** Fetch the CSV as a blob (so the JWT header is sent) and save it. */
  async downloadReport(name: ReportName, batch?: string) {
    const res = await api.get(`/admin/reports/${name}`, {
      params: { export: "csv", ...(batch ? { batch } : {}) },
      responseType: "blob",
    });
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kodemap-${name}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  users: (params: Record<string, string | undefined> = {}) =>
    api.get<Paginated<AdminUser>>("/admin/users", { params }).then((r) => r.data),
  user: (id: number) =>
    api.get<AdminUserDetail>(`/admin/users/${id}`).then((r) => r.data),
  updateUser: (
    id: number,
    payload: { role?: Role; is_active?: boolean; batch?: number | null },
  ) => api.patch<AdminUserDetail>(`/admin/users/${id}`, payload).then((r) => r.data),

  submissions: (params: Record<string, string | undefined> = {}) =>
    api.get<Paginated<AdminSubmission>>("/admin/submissions", { params }).then((r) => r.data),

  // batches (DRF router → trailing slashes)
  batches: () => api.get<Paginated<Batch>>("/admin/batches/").then((r) => r.data.results),
  createBatch: (payload: BatchInput) =>
    api.post<Batch>("/admin/batches/", payload).then((r) => r.data),
  updateBatch: (id: number, payload: BatchInput) =>
    api.patch<Batch>(`/admin/batches/${id}/`, payload).then((r) => r.data),
  deleteBatch: (id: number) => api.delete(`/admin/batches/${id}/`),
  batchMembers: (id: number) =>
    api.get<AdminUser[]>(`/admin/batches/${id}/members/`).then((r) => r.data),
  assignMembers: (id: number, payload: { add?: number[]; remove?: number[] }) =>
    api
      .post<{ added: number; removed: number }>(`/admin/batches/${id}/assign/`, payload)
      .then((r) => r.data),
};

export const ROLE_META: Record<Role, { label: string; cls: string }> = {
  learner: { label: "Learner", cls: "text-ink-dim bg-elevated" },
  supervisor: { label: "Supervisor", cls: "text-tan bg-tan-soft" },
  admin: { label: "Admin", cls: "text-ember bg-ember-soft" },
};
