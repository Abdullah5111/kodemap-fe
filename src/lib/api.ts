import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { API_URL } from "./config";
import { tokens } from "./tokens";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
  const access = tokens.access;
  if (access) cfg.headers.Authorization = `Bearer ${access}`;
  return cfg;
});

// --- single-flight refresh so parallel 401s don't each hit /auth/refresh ---
let refreshing: Promise<string | null> | null = null;

async function refreshAccess(): Promise<string | null> {
  const refresh = tokens.refresh;
  if (!refresh) return null;
  try {
    const { data } = await axios.post<{ access: string }>(
      `${API_URL}/auth/refresh`,
      { refresh },
      { headers: { "Content-Type": "application/json" } },
    );
    tokens.setAccess(data.access);
    return data.access;
  } catch {
    tokens.clear();
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    // Only try to refresh once per request, and never for the refresh call itself.
    if (status === 401 && original && !original._retry && tokens.refresh) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccess();
      const newAccess = await refreshing;
      refreshing = null;
      if (newAccess) {
        original.headers = { ...original.headers, Authorization: `Bearer ${newAccess}` };
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);

/** Pull a human-readable message out of a DRF error response. */
export function apiErrorMessage(err: unknown, fallback = "Something went wrong."): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { detail?: string; [k: string]: unknown }
      | undefined;
    if (data?.detail && typeof data.detail === "string") return data.detail;
    if (data && typeof data === "object") {
      const first = Object.values(data)[0];
      if (Array.isArray(first) && typeof first[0] === "string") return first[0];
      if (typeof first === "string") return first;
    }
    if (!err.response) return "Can't reach the server. Is the backend running?";
  }
  return fallback;
}
