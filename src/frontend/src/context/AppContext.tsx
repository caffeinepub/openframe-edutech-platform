import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { db } from "../lib/storage";
import type { AuthSession } from "../types/models";

interface AppContextType {
  session: AuthSession | null;
  login: (session: AuthSession) => void;
  logout: () => void;
  refresh: () => void;
  refreshKey: number;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() =>
    db.getSession(),
  );
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const stored = db.getSession();
    if (stored) setSession(stored);
  }, []);

  const login = useCallback((s: AuthSession) => {
    db.saveSession(s);
    setSession(s);
  }, []);

  const logout = useCallback(() => {
    db.clearSession();
    setSession(null);
  }, []);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <AppContext.Provider
      value={{ session, login, logout, refresh, refreshKey }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
