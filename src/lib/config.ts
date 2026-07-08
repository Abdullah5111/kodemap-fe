export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8000/api";

export const TOKEN_KEYS = {
  access: "kodemap-access",
  refresh: "kodemap-refresh",
} as const;

export const THEME_KEY = "kodemap-theme";
