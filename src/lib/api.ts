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
  // Never let a stalled/half-open connection hang a spinner forever.
  timeout: 20_000,
  // Send/receive the httpOnly refresh cookie on the credentialed cross-origin
  // calls to the API (login sets it, refresh rotates it, logout clears it).
  withCredentials: true,
});

/**
 * Broadcast an unrecoverable auth failure so the AuthProvider can drop the user
 * and redirect to login — instead of leaving a zombie "logged-in" shell whose
 * every request silently 401s.
 */
export const AUTH_LOGOUT_EVENT = "kodemap:auth-logout";
function forceLogout() {
  tokens.clear();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
  }
}

api.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
  const access = tokens.access;
  if (access) cfg.headers.Authorization = `Bearer ${access}`;
  // For file uploads (FormData) drop the instance-default application/json so the
  // browser sets multipart/form-data with the correct boundary — otherwise the
  // server can't parse the file ("The submitted data was not a file").
  if (typeof FormData !== "undefined" && cfg.data instanceof FormData) {
    cfg.headers.delete("Content-Type");
  }
  return cfg;
});

// --- single-flight refresh so parallel 401s don't each hit /auth/refresh ---
let refreshing: Promise<string | null> | null = null;

async function refreshAccess(): Promise<string | null> {
  try {
    // The refresh token rides along as the httpOnly cookie — no body needed.
    const { data } = await axios.post<{ access: string }>(
      `${API_URL}/auth/refresh`,
      {},
      { headers: { "Content-Type": "application/json" }, withCredentials: true },
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

    // Only try to refresh once per request, and never for the refresh call itself
    // (that one uses a bare axios call, so it never hits this interceptor).
    if (status === 401 && original && !original._retry) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccess();
      const newAccess = await refreshing;
      refreshing = null;
      if (newAccess) {
        original.headers = { ...original.headers, Authorization: `Bearer ${newAccess}` };
        return api(original);
      }
      // Refresh cookie missing/expired → the session is truly over.
      forceLogout();
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
