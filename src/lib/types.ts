export type Role = "learner" | "admin" | "supervisor";

export type EducationLevel =
  | "matric"
  | "intermediate"
  | "undergraduate"
  | "graduate"
  | "other";

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: Role;
  education_level: EducationLevel | "";
  institution: string;
  field_of_study: string;
  graduation_year: number | null;
  current_year: string;
  github_url: string;
  avatar: string | null;
  bio: string;
  streak_count: number;
  last_active_date: string | null;
  is_email_verified: boolean;
  date_joined: string;
  batch: number | null;
  batch_name: string | null;
}

export interface TokenPair {
  access: string;
  refresh: string;
}

/** Where a user lands after authentication, based on role. */
export function homePathForRole(role: Role): string {
  return role === "admin" || role === "supervisor" ? "/admin" : "/roadmap";
}
