import React, { createContext, useContext, useState, useCallback } from "react";
import type { User } from "../types";

interface MarshalSession {
  user: User | null;
  sessionToken: string | null;
  postId: number | null;
  login: (user: User, token: string) => void;
  setPost: (postId: number) => void;
}

const MarshalContext = createContext<MarshalSession | null>(null);

export function MarshalProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("marshal_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [sessionToken, setSessionToken] = useState<string | null>(
    () => localStorage.getItem("session_token")
  );
  const [postId, setPostIdState] = useState<number | null>(() => {
    const raw = localStorage.getItem("post_id");
    return raw ? Number(raw) : null;
  });

  const login = useCallback((u: User, token: string) => {
    localStorage.setItem("marshal_user", JSON.stringify(u));
    localStorage.setItem("session_token", token);
    setUser(u);
    setSessionToken(token);
  }, []);

  const setPost = useCallback((id: number) => {
    localStorage.setItem("post_id", String(id));
    setPostIdState(id);
  }, []);

  return (
    <MarshalContext.Provider value={{ user, sessionToken, postId, login, setPost }}>
      {children}
    </MarshalContext.Provider>
  );
}

export function useMarshal() {
  const ctx = useContext(MarshalContext);
  if (!ctx) throw new Error("useMarshal must be used within MarshalProvider");
  return ctx;
}
