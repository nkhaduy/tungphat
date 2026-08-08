import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { SessionUser } from "../shared/types";
import { api, setCsrfToken } from "./api";

type AuthState = {
  loading: boolean;
  user: SessionUser | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);

  const refresh = async () => {
    try {
      const result = await api<{ authenticated: true; user: SessionUser; csrf: string }>("/api/auth/session");
      setCsrfToken(result.csrf);
      setUser(result.user);
    } catch {
      setCsrfToken("");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, []);

  const signOut = async () => {
    await api("/api/auth/logout", { method: "POST" });
    setCsrfToken("");
    setUser(null);
    window.location.assign("/login");
  };

  const value = useMemo(() => ({ loading, user, refresh, signOut }), [loading, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider is missing.");
  return value;
}
