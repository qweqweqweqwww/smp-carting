import React, { createContext, useContext, useState, useCallback } from "react";
import type { User } from "../types";
import { loginUser } from "../api/users";

interface AuthState {
  user: User | null;
  sessionToken: string | null;
  login: (user: User, token: string) => void;
  loginWithPassword: (name: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as User) : null;
  });
  const [sessionToken, setSessionToken] = useState<string | null>(
    () => localStorage.getItem("session_token")
  );

  const login = useCallback((u: User, token: string) => {
    localStorage.setItem("user", JSON.stringify(u));
    localStorage.setItem("session_token", token);
    setUser(u);
    setSessionToken(token);
  }, []);

  const loginWithPassword = useCallback(async (name: string, password: string) => {
    const { user: u, session_token } = await loginUser(name, password);
    localStorage.setItem("user", JSON.stringify(u));
    localStorage.setItem("session_token", session_token);
    setUser(u);
    setSessionToken(session_token);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("session_token");
    setUser(null);
    setSessionToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, sessionToken, login, loginWithPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
