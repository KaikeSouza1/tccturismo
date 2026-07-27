import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiRequest, ApiError } from "./api";
import type { User } from "../types";

const TOKEN_KEY = "trilha_local_admin_token";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = localStorage.getItem(TOKEN_KEY);
      if (!stored) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await apiRequest<User>("/auth/me", { token: stored });
        if (me.role !== "admin" && me.role !== "platform_admin") {
          throw new Error("not admin");
        }
        setToken(stored);
        setUser(me);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function login(email: string, password: string) {
    const result = await apiRequest<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    if (result.user.role !== "admin" && result.user.role !== "platform_admin") {
      throw new ApiError(403, "Esta conta nao tem acesso ao painel administrativo");
    }
    localStorage.setItem(TOKEN_KEY, result.token);
    setToken(result.token);
    setUser(result.user);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  const value = useMemo(() => ({ user, token, isLoading, login, logout }), [user, token, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return ctx;
}
