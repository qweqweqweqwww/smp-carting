import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { redeemInvite } from "../api/marshal";
import { useMarshal } from "../contexts/MarshalContext";

export function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const { login, setPost } = useMarshal();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const handledRef = useRef(false);

  useEffect(() => {
    if (!token || handledRef.current) return;
    handledRef.current = true;

    redeemInvite(token)
      .then(({ user, session_token }) => {
        login(user, session_token);
        if (user.assigned_post_id !== null) {
          setPost(user.assigned_post_id);
        }
        navigate("/record", { replace: true });
      })
      .catch((err) => {
        setStatus("error");
        const httpStatus = err?.response?.status;
        const detail = err?.response?.data?.detail ?? "";
        let msg = "Ссылка недействительна или истекла.";
        if (httpStatus === 409 || detail.includes("already redeemed")) {
          msg = "Эта ссылка уже была использована. Попросите организатора сгенерировать новый QR-код.";
        } else if (httpStatus === 410 || detail.includes("expired")) {
          msg = "Срок действия ссылки истёк. Попросите организатора выслать новый QR-код.";
        } else if (httpStatus === 404) {
          msg = "Ссылка не найдена. Проверьте правильность QR-кода.";
        }
        setErrorMsg(msg);
      });
  }, [token, login, navigate]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-600 px-6">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-white/15 font-mono text-[13px] font-black text-white">
            SMP
          </span>
          <div>
            <div className="text-[14px] font-bold text-white leading-tight">Race Control</div>
            <div className="text-[11px] text-white/60">Маршал</div>
          </div>
        </div>
        <div className="mb-5">
          <svg className="animate-smp-spin h-12 w-12 text-white" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
        <p className="text-[16px] font-semibold tracking-tight text-white">Подключение к системе гонки…</p>
        <p className="mt-1.5 text-[13px] text-white/60">Пожалуйста, подождите</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 text-center shadow-md">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emergency-bg">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emergency">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </div>
        <h1 className="mb-2 text-[18px] font-bold text-text">Ошибка входа</h1>
        <p className="text-[13px] text-text-2">{errorMsg}</p>
        <p className="mt-4 text-[12px] text-text-3">
          Попросите организатора выслать новую ссылку.
        </p>
      </div>
    </div>
  );
}
