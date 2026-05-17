import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { OrganizerDashboard } from "./pages/organizer/OrganizerDashboard";
import { JudgeDashboard } from "./pages/judge/JudgeDashboard";
import { SecretaryDashboard } from "./pages/secretary/SecretaryDashboard";
import { JoinPage } from "./pages/JoinPage";
import "./index.css";

const queryClient = new QueryClient();

function RequireRole({ role, children }: { role: string; children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RoleRouter() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "marshal") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-8">
        <p className="text-text-3">Маршалы используют мобильное приложение.</p>
      </div>
    );
  }
  return <OrganizerDashboard />;
}

function LoginPage() {
  const { loginWithPassword } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginWithPassword(name.trim(), password);
      navigate("/", { replace: true });
    } catch {
      setError("Неверное имя или пароль");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-600 p-6">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-10 shadow-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-sm bg-brand-500 font-mono text-[15px] font-black text-white">
            SMP
          </div>
          <h1 className="text-[18px] font-bold text-text">SMP Race Control</h1>
          <p className="mt-1 text-[12px] text-text-3">Судьи и секретари</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="label-caps mb-1.5 block">Имя</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="username"
              placeholder="Иван Иванов"
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2.5 text-[13px] text-text
                         placeholder:text-text-mute focus:border-brand-500 focus:outline-none
                         focus:ring-2 focus:ring-brand-500/20 transition-colors"
            />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2.5 text-[13px] text-text
                         placeholder:text-text-mute focus:border-brand-500 focus:outline-none
                         focus:ring-2 focus:ring-brand-500/20 transition-colors"
            />
          </div>

          {error && (
            <div className="rounded-md border border-emergency/30 bg-emergency-bg px-3 py-2 text-[12px] text-emergency">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-md bg-brand-500 py-2.5 text-[13px] font-bold text-white
                       hover:bg-brand-600 disabled:opacity-50 transition-colors"
          >
            {loading ? "Вход…" : "Войти"}
          </button>
        </form>

        <p className="mt-5 text-center text-[11.5px] text-text-3">
          Маршалы: используйте QR-приглашение
        </p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RoleRouter />} />
            <Route path="/join/:token" element={<JoinPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/races/:raceId/judge"
              element={<RequireRole role="judge"><JudgeDashboard /></RequireRole>}
            />
            <Route
              path="/races/:raceId/secretary"
              element={<RequireRole role="secretary"><SecretaryDashboard /></RequireRole>}
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
