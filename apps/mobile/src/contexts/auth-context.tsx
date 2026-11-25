import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { request } from "@/lib/api";
import type { Account, AuthResponse, AuthSession } from "@/lib/types";

const sessionKey = "atende.auth-session";

type Registration = {
  nome: string;
  email: string;
  setor: string;
  telefone: string;
  senha: string;
};

type AuthContextValue = {
  ready: boolean;
  session: AuthSession | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: Registration) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function createSession(result: AuthResponse): AuthSession {
  const details = result.role === "ADMIN" ? result.administrador : result.usuario;
  const account: Account = { ...details, role: result.role };
  return {
    accessToken: result.accessToken,
    expiresAt: Date.now() + result.expiresIn * 1000,
    account,
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    void SecureStore.getItemAsync(sessionKey)
      .then(async (stored) => {
        if (!stored) return;
        try {
          const parsed = JSON.parse(stored) as AuthSession;
          if (
            typeof parsed.accessToken === "string" &&
            typeof parsed.expiresAt === "number" && parsed.expiresAt > Date.now() &&
            typeof parsed.account?.id === "number" &&
            (parsed.account.role === "USER" || parsed.account.role === "ADMIN")
          ) {
            if (active) setSession(parsed);
          } else {
            await SecureStore.deleteItemAsync(sessionKey);
          }
        } catch {
          await SecureStore.deleteItemAsync(sessionKey);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setReady(true);
      });

    return () => { active = false; };
  }, []);

  const saveSession = useCallback(async (result: AuthResponse) => {
    const nextSession = createSession(result);
    await SecureStore.setItemAsync(sessionKey, JSON.stringify(nextSession));
    setSession(nextSession);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await request<AuthResponse>("/auth/login", {
      method: "POST",
      body: { email: email.trim().toLowerCase(), senha: password },
    });
    await saveSession(result);
  }, [saveSession]);

  const register = useCallback(async (data: Registration) => {
    const result = await request<AuthResponse>("/auth/register", {
      method: "POST",
      body: { ...data, nome: data.nome.trim(), email: data.email.trim().toLowerCase(), setor: data.setor.trim(), telefone: data.telefone.trim() },
    });
    await saveSession(result);
  }, [saveSession]);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(sessionKey).catch(() => undefined);
    setSession(null);
  }, []);

  const value = useMemo(() => ({ ready, session, login, register, logout }), [ready, session, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth precisa ser usado dentro de AuthProvider.");
  return context;
}
