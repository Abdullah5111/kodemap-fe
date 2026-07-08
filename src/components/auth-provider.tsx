"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authApi } from "@/lib/auth-api";
import { tokens } from "@/lib/tokens";
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
    if (!tokens.access && !tokens.refresh) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
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
    authApi.logout();
    setUser(null);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
