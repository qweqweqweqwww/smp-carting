import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { peekInvite, redeemInvite } from "../api/users";
import { useAuth } from "../contexts/AuthContext";

export function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const handledRef = useRef(false);

  useEffect(() => {
    if (!token || handledRef.current) return;
    handledRef.current = true;

    (async () => {
      try {
        // Peek at the role without consuming the token.
        // If it belongs to a marshal, redirect to the marshal app so the
        // token stays unredeemed and the marshal app can redeem it itself.
        const { role } = await peekInvite(token);
        if (role === "marshal") {
          const marshalUrl = import.meta.env.VITE_MARSHAL_APP_URL ?? "http://localhost:5175";
          window.location.replace(`${marshalUrl}/join/${token}`);
          return;
        }

        const { user, session_token } = await redeemInvite(token);
        localStorage.setItem("race_id", String(user.race_id));
        login(user, session_token);
        navigate("/", { replace: true });
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number; data?: { detail?: string } } })?.response?.status;
        const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "";
        let msg = "Ссылка недействительна или истекла.";
        if (status === 409 || detail.includes("already redeemed")) {
          msg = "Эта ссылка уже была использована. Попросите организатора сгенерировать новый QR-код.";
        } else if (status === 410 || detail.includes("expired")) {
          msg = "Срок действия ссылки истёк. Попросите организатора сгенерировать новый QR-код.";
        } else if (status === 404) {
          msg = "Ссылка не найдена. Проверьте правильность QR-кода.";
        }
        setError(msg);
      }
    })();
  }, [token, login, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-6">
        <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 shadow-md text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emergency-bg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emergency">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </div>
          <h1 className="mb-2 text-[18px] font-bold text-text">Ошибка входа</h1>
          <p className="text-[13px] text-text-2">{error}</p>
          <p className="mt-4 text-[12px] text-text-3">
            Попросите организатора выслать новую ссылку.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-600 px-6">
      <div className="mb-8 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-white/15 font-mono text-[15px] font-black text-white">
          SMP
        </span>
        <div>
          <div className="text-[15px] font-bold text-white leading-tight">Race Control</div>
          <div className="text-[11px] text-white/60">SMP Carting</div>
        </div>
      </div>

      <div className="mb-6 flex h-14 w-14 items-center justify-center">
        <svg className="animate-smp-spin h-10 w-10 text-white" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>

      <p className="text-[16px] font-semibold tracking-tight text-white">Подключение к системе гонки…</p>
      <p className="mt-1.5 text-[13px] text-white/60">Пожалуйста, подождите</p>
    </div>
  );
}
