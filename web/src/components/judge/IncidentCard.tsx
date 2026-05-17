import { useState } from "react";
import { Pill } from "../common/Pill";
import type { IncidentNewPayload, DecisionType } from "../../types";

interface Props {
  payload: IncidentNewPayload;
  onDecide: (type: DecisionType, penaltyDetail?: string) => Promise<void>;
  big?: boolean;
}

const VIOLATION_RU: Record<string, string> = {
  collision:      "Столкновение",
  track_limits:   "Срез трассы",
  false_start:    "Фальстарт",
  unsafe_driving: "Опасное вождение",
  blocking:       "Блокировка",
  other:          "Другое",
};

export function IncidentCard({ payload, onDecide, big = false }: Props) {
  const [penaltyDetail, setPenaltyDetail] = useState("");
  const [deciding, setDeciding] = useState(false);

  const handleDecide = async (type: DecisionType) => {
    setDeciding(true);
    await onDecide(type, type === "penalty" ? penaltyDetail : undefined);
    setDeciding(false);
  };

  const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className={`flex flex-col overflow-hidden rounded-lg border border-border bg-surface
      ${payload.is_emergency ? "border-l-[3px] border-l-emergency" : "border-l-[3px] border-l-brand-500"}`}
    >
      {payload.is_emergency && (
        <div className="flex items-center justify-between bg-emergency px-3.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-white">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-white smp-pulse" />
            Авария
          </span>
        </div>
      )}

      <div className={`flex flex-col gap-3 ${big ? "p-5" : "p-4"}`}>
        {/* Meta row */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Pill tone="brand" mono>#{payload.incident_id}</Pill>
            <Pill tone="neutral" mono>{payload.post_label}</Pill>
          </div>
          <span className="font-mono tnum text-[11px] text-text-3">{timestamp}</span>
        </div>

        {/* Pilots */}
        <div>
          <div className="label-caps mb-1">Пилоты</div>
          <div className={`font-mono tnum font-bold leading-none tracking-tight text-text ${big ? "text-[52px]" : "text-[32px]"}`}>
            {payload.pilot_numbers.join(" · ") || "—"}
          </div>
        </div>

        {/* Violation + location */}
        <div className="flex items-center gap-2">
          <span className={`font-semibold text-text ${big ? "text-[15px]" : "text-[13px]"}`}>
            {VIOLATION_RU[payload.violation_type ?? ""] ?? (payload.violation_type || "Неизвестно")}
          </span>
        </div>

        {/* Transcript */}
        {payload.free_text && (
          <blockquote className="m-0 rounded border-l-2 border-border-strong bg-surface-2 px-3 py-2 text-[12px] italic leading-relaxed text-text-2">
            «{payload.free_text}»
          </blockquote>
        )}

        {/* Audio player */}
        <div className="rounded-md border border-border bg-surface-2 px-3 py-2">
          <audio
            src={`/api/v1${payload.audio_url}`}
            controls
            className="w-full h-8"
          />
        </div>

        {/* Penalty detail */}
        <input
          type="text"
          placeholder="Детали штрафа (+5 сек, проезд через пит-лейн…)"
          value={penaltyDetail}
          onChange={(e) => setPenaltyDetail(e.target.value)}
          className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-[13px] text-text
                     placeholder:text-text-mute focus:border-brand-500 focus:outline-none
                     focus:ring-2 focus:ring-brand-500/20 transition-colors"
        />

        {/* Decision buttons */}
        <div className="flex gap-2">
          <button
            disabled={deciding}
            onClick={() => handleDecide("penalty")}
            className="flex-1 rounded-md bg-emergency py-2 text-[12.5px] font-bold text-white
                       hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            Штраф
          </button>
          <button
            disabled={deciding}
            onClick={() => handleDecide("warning")}
            className="flex-1 rounded-md bg-warning py-2 text-[12.5px] font-bold text-white
                       hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            Предупр.
          </button>
          <button
            disabled={deciding}
            onClick={() => handleDecide("dismiss")}
            className="flex-1 rounded-md border border-border bg-surface-2 py-2 text-[12.5px] font-semibold text-text-2
                       hover:bg-surface hover:border-border-strong disabled:opacity-50 transition-colors"
          >
            Снять
          </button>
        </div>
      </div>
    </div>
  );
}
