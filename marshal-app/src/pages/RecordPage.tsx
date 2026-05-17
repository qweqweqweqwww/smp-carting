import { useState, useCallback, useEffect } from "react";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import { useMarshal } from "../contexts/MarshalContext";
import { uploadAudio, confirmIncident, getRace } from "../api/marshal";
import type { RecordingState, Race, Post } from "../types";

const RACE_STATUS_LABEL: Record<string, string> = {
  draft:    "Не начата",
  active:   "В эфире",
  finished: "Завершена",
  archived: "Архив",
};

function MicIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function Waveform({ bars = 32, animated = false, color = "currentColor" }: { bars?: number; animated?: boolean; color?: string }) {
  return (
    <div className="flex items-center justify-center gap-[3px]" style={{ height: 48 }}>
      {Array.from({ length: bars }).map((_, i) => {
        const baseHeight = 8 + Math.sin(i * 0.8) * 12 + Math.sin(i * 1.7) * 8;
        return (
          <div
            key={i}
            className={animated ? "smp-pulse" : ""}
            style={{
              width: 3,
              height: baseHeight + (animated ? Math.random() * 16 : 0),
              borderRadius: 2,
              backgroundColor: color,
              animationDelay: `${(i * 0.05) % 1.6}s`,
              minHeight: 4,
            }}
          />
        );
      })}
    </div>
  );
}

export function RecordPage() {
  const { user, postId } = useMarshal();
  const recorder = useAudioRecorder();

  const [state, setState] = useState<RecordingState>("idle");
  const [isEmergency, setIsEmergency] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [incidentCount, setIncidentCount] = useState(0);

  const [race, setRace] = useState<Race | null>(null);
  const [post, setPost] = useState<Post | null>(null);

  useEffect(() => {
    if (!user) return;
    getRace(user.race_id)
      .then((data) => {
        setRace({ id: data.id, name: data.name, venue: data.venue, status: data.status });
        if (postId !== null) {
          const found = data.posts.find((p) => p.id === postId) ?? null;
          setPost(found);
        }
      })
      .catch(() => {});
  }, [user, postId]);

  const handlePttStart = useCallback(async () => {
    if (state !== "idle") return;
    setState("recording");
    await recorder.start();
  }, [state, recorder]);

  const handlePttEnd = useCallback(async () => {
    if (state !== "recording") return;
    recorder.stop();
    setState("uploading");

    await new Promise((r) => setTimeout(r, 400));

    const recordedBlob = recorder.blobRef.current;
    if (!recordedBlob || !user || postId === null) {
      setState("error");
      setErrorMsg("Запись недоступна. Проверьте доступ к микрофону.");
      return;
    }

    try {
      const result = await uploadAudio(recordedBlob, user.race_id, postId, user.id, isEmergency);
      setState("sending");
      await confirmIncident(
        result.incident_id,
        result.pilot_numbers,
        result.violation_type,
        result.free_text,
        isEmergency,
      );
      setIncidentCount((c) => c + 1);
      setState("done");
      setTimeout(() => {
        setState("idle");
        recorder.reset();
        setIsEmergency(false);
        setErrorMsg("");
      }, 1500);
    } catch {
      setState("error");
      setErrorMsg("Ошибка отправки. Проверьте подключение к сети.");
    }
  }, [state, recorder, user, postId, isEmergency]);

  const handleRetry = useCallback(() => {
    recorder.reset();
    setState("idle");
    setErrorMsg("");
  }, [recorder]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-6">
        <div className="text-center">
          <p className="font-semibold text-text-2">Сессия не инициализирована.</p>
          <p className="mt-1 text-[12px] text-text-3">Используйте ссылку-приглашение для входа.</p>
        </div>
      </div>
    );
  }

  if (postId === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-6">
        <div className="text-center">
          <p className="font-semibold text-text-2">Пост не назначен.</p>
          <p className="mt-1 text-[12px] text-text-3">Попросите организатора назначить вас на пост и выслать новую ссылку.</p>
        </div>
      </div>
    );
  }

  const isRecording = state === "recording";
  const isLive = race?.status === "active";

  const postLabel = post?.label ?? `Пост ${postId}`;
  const raceName = race?.name ?? "Гонка";
  const statusLabel = race ? RACE_STATUS_LABEL[race.status] ?? race.status : "—";

  return (
    <div className="flex min-h-screen flex-col bg-bg select-none">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-bg px-[18px] py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-brand-500 font-mono text-[11px] font-black text-white">
            М
          </span>
          <div>
            <div className="text-[12px] font-bold leading-tight text-text tracking-tight">
              {postLabel} · {user.name}
            </div>
            <div className="text-[10.5px] text-text-3">{raceName}</div>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${isLive ? "text-success" : "text-text-3"}`}>
          {isLive && <span className="h-1.5 w-1.5 rounded-full bg-success smp-pulse" />}
          {statusLabel}
        </div>
      </header>

      {/* Hero card */}
      <div className="mx-[18px] mt-4 flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3.5">
        <div>
          <div className="label-caps">Время</div>
          <div className="font-mono tnum mt-1 text-[26px] font-bold leading-none tracking-tight text-text">
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
        <div className="text-right">
          <div className="label-caps">Отправлено</div>
          <div className="mt-1 flex items-baseline gap-1 justify-end">
            <span className="font-mono tnum text-[26px] font-bold leading-none text-brand-500">{String(incidentCount).padStart(2, "0")}</span>
            <span className="text-[13px] text-text-3">/ инц.</span>
          </div>
        </div>
      </div>

      {/* Main recording area */}
      <div className="mx-[18px] mt-5 flex flex-1 flex-col items-center gap-6 pb-8">
        {/* Status line */}
        <div className="flex items-center gap-2.5">
          {isRecording ? (
            <>
              <span className="h-2 w-2 rounded-full bg-emergency smp-pulse" />
              <span className="text-[13.5px] font-bold text-emergency">Запись</span>
            </>
          ) : state === "uploading" || state === "sending" ? (
            <span className="text-[13px] text-text-3">Обработка…</span>
          ) : state === "done" ? (
            <span className="flex items-center gap-2 text-[13px] font-bold text-success">
              <CheckIcon /> Отправлено!
            </span>
          ) : (
            <span className="text-[13px] text-text-3">Нажмите и держите</span>
          )}
        </div>

        {/* Waveform */}
        <div className={`w-full rounded-lg border px-3 py-5 flex items-center justify-center transition-colors
          ${isRecording
            ? "border-emergency/30 bg-emergency-bg text-emergency"
            : "border-border bg-surface text-brand-500"
          }`}
        >
          <Waveform bars={36} animated={isRecording} color={isRecording ? "var(--c-emergency)" : "var(--brand-500)"} />
        </div>

        {/* PTT button */}
        <button
          onPointerDown={handlePttStart}
          onPointerUp={handlePttEnd}
          onPointerLeave={handlePttEnd}
          disabled={state !== "idle" && !isRecording}
          className={`relative flex h-[168px] w-[168px] flex-col items-center justify-center rounded-full text-white transition-all duration-150 active:scale-95 disabled:opacity-60
            ${isRecording
              ? "bg-emergency shadow-[0_6px_24px_rgba(220,38,38,0.45)]"
              : "bg-brand-500 shadow-brand hover:bg-brand-600"
            }`}
        >
          {isRecording && (
            <span className="absolute inset-[-12px] rounded-full border-2 border-white/30 smp-pulse" />
          )}
          <MicIcon size={38} />
          <span className="mt-2 text-[10.5px] font-bold uppercase tracking-[0.12em]">
            {isRecording ? "Отпустите" : "Удерживайте"}
          </span>
        </button>

        {/* Emergency toggle */}
        <button
          onClick={() => setIsEmergency((v) => !v)}
          className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-[11.5px] font-semibold uppercase tracking-[0.08em] transition-all
            ${isEmergency
              ? "border-emergency bg-emergency text-white"
              : "border-emergency/35 bg-transparent text-emergency hover:border-emergency/60"
            }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {isEmergency ? "SOS · Аварийный" : "Аварийный режим"}
        </button>

        {state === "error" && (
          <div className="w-full text-center">
            <p className="mb-2 text-[12px] text-emergency">{errorMsg}</p>
            <button
              onClick={handleRetry}
              className="rounded-md border border-border px-5 py-2 text-[12px] font-semibold text-text-2 hover:bg-surface transition-colors"
            >
              Повторить
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
