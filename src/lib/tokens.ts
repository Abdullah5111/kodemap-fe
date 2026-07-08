import { TOKEN_KEYS } from "./config";
import type { TokenPair } from "./types";

/** Access/refresh token storage. localStorage for MVP; swap for httpOnly cookies later. */
export const tokens = {
  get access(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEYS.access);
  },
  get refresh(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEYS.refresh);
  },
  set({ access, refresh }: TokenPair) {
    localStorage.setItem(TOKEN_KEYS.access, access);
    localStorage.setItem(TOKEN_KEYS.refresh, refresh);
  },
  setAccess(access: string) {
    localStorage.setItem(TOKEN_KEYS.access, access);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEYS.access);
    localStorage.removeItem(TOKEN_KEYS.refresh);
  },
};
