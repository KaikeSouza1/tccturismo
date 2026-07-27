import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Preferences } from "@capacitor/preferences";
import { apiRequest } from "./api";
import type { User } from "../types";

const TOKEN_KEY = "trilha_local_token";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await Preferences.get({ key: TOKEN_KEY });
      if (!stored.value) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await apiRequest<User>("/auth/me", { token: stored.value });
        setToken(stored.value);
        setUser(me);
      } catch {
        await Preferences.remove({ key: TOKEN_KEY });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function persistSession(nextToken: string, nextUser: User) {
    await Preferences.set({ key: TOKEN_KEY, value: nextToken });
    setToken(nextToken);
    setUser(nextUser);
  }

  async function login(email: string, password: string) {
    const result = await apiRequest<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    await persistSession(result.token, result.user);
  }

  async function register(name: string, email: string, password: string) {
    const result = await apiRequest<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: { name, email, password },
    });
    await persistSession(result.token, result.user);
  }

  async function logout() {
    await Preferences.remove({ key: TOKEN_KEY });
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, token, isLoading, login, register, logout }),
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return ctx;
}
