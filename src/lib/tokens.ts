/**
 * Access-token storage — IN MEMORY ONLY.
 *
 * The refresh token is NOT stored here: it lives in an httpOnly cookie the browser
 * manages, so JavaScript (and therefore any XSS) can never read it. Only the
 * short-lived access token is held here, and only for the lifetime of the tab —
 * a reload re-bootstraps it from the refresh cookie via /auth/refresh.
 */
let accessToken: string | null = null;

export const tokens = {
  get access(): string | null {
    return accessToken;
  },
  setAccess(access: string | null) {
    accessToken = access;
  },
  clear() {
    accessToken = null;
  },
};
