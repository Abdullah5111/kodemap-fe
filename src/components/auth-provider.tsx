"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AUTH_LOGOUT_EVENT } from "@/lib/api";
import { authApi } from "@/lib/auth-api";
import type { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<User | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      // On a cold load there's no in-memory access token; hitting /me triggers the
      // api layer to mint one from the httpOnly refresh cookie (if the session is
      // still valid). No cookie ⇒ 401 ⇒ we settle as logged-out.
      const me = await authApi.me();
      setUser(me);
      return me;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    // Clear the UI immediately; blacklist + cookie-clear happen in the background.
    setUser(null);
    void authApi.logout();
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // When the API layer hits an unrecoverable 401 (refresh expired/failed), it
  // broadcasts a logout so we drop the user immediately instead of showing a
  // zombie authenticated shell whose every request silently 401s.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onLogout = () => setUser(null);
    window.addEventListener(AUTH_LOGOUT_EVENT, onLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, onLogout);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
