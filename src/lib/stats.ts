import { api } from "./api";
import type { Difficulty } from "./content";
import type { SubmissionStatus } from "./solve";

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  username: string;
  full_name: string;
  institution: string;
  education_level: string;
  score: number;
  solved: number;
  streak: number;
  is_me: boolean;
}

export interface LeaderboardResponse {
  results: LeaderboardEntry[];
  me: LeaderboardEntry | null;
  scope: "global" | "batch";
  batch: { id: number; name: string } | null;
}

export interface RecentSubmission {
  id: number;
  question_title: string;
  question_slug: string;
  language_name: string;
  mode: "run" | "submit";
  status: SubmissionStatus;
  score_awarded: number;
  created_at: string;
}

export interface MyStats {
  score: number;
  solved: number;
  attempted: number;
  rank: number | null;
  streak: number;
  submissions_total: number;
  accepted_count: number;
  by_difficulty: Partial<Record<Difficulty, number>>;
  recent_submissions: RecentSubmission[];
}

export const statsApi = {
  leaderboard: (scope: "global" | "batch" = "global") =>
    api
      .get<LeaderboardResponse>("/leaderboard", {
        params: scope === "batch" ? { scope: "batch" } : undefined,
      })
      .then((r) => r.data),
  myStats: () => api.get<MyStats>("/me/stats").then((r) => r.data),
};

/** "3m ago" style relative time from an ISO string. */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const s = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
