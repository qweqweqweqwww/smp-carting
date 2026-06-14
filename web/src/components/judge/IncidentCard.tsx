import { useState, useEffect } from "react";
import { Pill } from "../common/Pill";
import { VIOLATION_RU } from "../../utils/labels";
import type { IncidentNewPayload, DecisionType, SplitDecisionItem } from "../../types";

interface Props {
  payload: IncidentNewPayload;
  onDecide: (type: DecisionType, penaltyDetail?: string, assignedPilotNumber?: string) => Promise<void>;
  onDecideSplit?: (decisions: SplitDecisionItem[]) => Promise<void>;
  big?: boolean;
}

type Mode = "single" | "split";

interface PilotState {
  pilotNumber: string;
  decision: DecisionType | null;
  penaltyDetail: string;
}

function emptyPilot(number = ""): PilotState {
  return { pilotNumber: number, decision: null, penaltyDetail: "" };
}

function DecisionToggle({
  value,
  onChange,
  disabled,
}: {
  value: DecisionType | null;
  onChange: (v: DecisionType) => void;
  disabled?: boolean;
}) {
  const options: { type: DecisionType; label: string; active: string; base: string }[] = [
    {
      type: "penalty",
      label: "Штраф",
      active: "bg-emergency text-white border-emergency",
      base: "border-border bg-surface-2 text-text-3 hover:bg-surface hover:text-text",
    },
    {
      type: "warning",
      label: "Предупр.",
      active: "bg-warning text-white border-warning",
      base: "border-border bg-surface-2 text-text-3 hover:bg-surface hover:text-text",
    },
    {
      type: "dismiss",
      label: "Снять",
      active: "border-border-strong bg-surface text-text",
      base: "border-border bg-surface-2 text-text-3 hover:bg-surface hover:text-text",
    },
  ];
  return (
    <div className="flex gap-1.5">
      {options.map((o) => (
        <button
          key={o.type}
          disabled={disabled}
          onClick={() => onChange(o.type)}
          className={`flex-1 rounded py-1.5 text-[11.5px] font-bold border transition-colors
            ${value === o.type ? o.active : o.base}
            disabled:opacity-40`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function PilotDecisionRow({
  label,
  state,
  onChange,
  disabled,
}: {
  label: string;
  state: PilotState;
  onChange: (s: PilotState) => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-surface-2 p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3 w-16 shrink-0">
          {label}
        </span>
        <span className="text-[12px] text-text-2">Пилот №</span>
        <input
          type="text"
          value={state.pilotNumber}
          onChange={(e) => onChange({ ...state, pilotNumber: e.target.value })}
          placeholder="—"
          disabled={disabled}
          className="w-16 rounded border border-border bg-surface px-2 py-1 text-[13px] font-mono font-bold text-text
                     focus:border-brand-500 focus:outline-none disabled:opacity-50 transition-colors"
        />
      </div>
      <DecisionToggle
        value={state.decision}
        onChange={(d) => onChange({ ...state, decision: d })}
        disabled={disabled}
      />
      {state.decision === "penalty" && (
        <input
          type="text"
          placeholder="Детали штрафа…"
          value={state.penaltyDetail}
          onChange={(e) => onChange({ ...state, penaltyDetail: e.target.value })}
          disabled={disabled}
          className="w-full rounded border border-border bg-surface px-2 py-1.5 text-[12px] text-text
                     placeholder:text-text-mute focus:border-brand-500 focus:outline-none
                     disabled:opacity-50 transition-colors"
        />
      )}
    </div>
  );
}

export function IncidentCard({ payload, onDecide, onDecideSplit, big = false }: Props) {
  const [mode, setMode] = useState<Mode>("single");

  // Single mode
  const [assignedPilot, setAssignedPilot] = useState(
    payload.pilot_numbers.length === 1 ? String(payload.pilot_numbers[0]) : ""
  );
  const [penaltyDetail, setPenaltyDetail] = useState("");
  const [deciding, setDeciding] = useState(false);

  // Split mode
  const [pilot1, setPilot1] = useState<PilotState>(
    emptyPilot(payload.pilot_numbers[0] != null ? String(payload.pilot_numbers[0]) : "")
  );
  const [pilot2, setPilot2] = useState<PilotState>(
    emptyPilot(payload.pilot_numbers[1] != null ? String(payload.pilot_numbers[1]) : "")
  );

  // Reset all state when switching to a new incident
  useEffect(() => {
    setMode("single");
    setAssignedPilot(
      payload.pilot_numbers.length === 1 ? String(payload.pilot_numbers[0]) : ""
    );
    setPenaltyDetail("");
    setPilot1(emptyPilot(payload.pilot_numbers[0] != null ? String(payload.pilot_numbers[0]) : ""));
    setPilot2(emptyPilot(payload.pilot_numbers[1] != null ? String(payload.pilot_numbers[1]) : ""));
  }, [payload.incident_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSingleDecide = async (type: DecisionType) => {
    setDeciding(true);
    try {
      await onDecide(
        type,
        type === "penalty" ? penaltyDetail : undefined,
        assignedPilot.trim() || undefined,
      );
    } finally {
      setDeciding(false);
    }
  };

  const splitReady =
    !!pilot1.decision && !!pilot2.decision &&
    pilot1.pilotNumber.trim() !== "" && pilot2.pilotNumber.trim() !== "";

  const handleSplitDecide = async () => {
    if (!splitReady || !onDecideSplit) return;
    setDeciding(true);
    try {
      await onDecideSplit([
        {
          pilot_number: pilot1.pilotNumber.trim(),
          decision_type: pilot1.decision!,
          penalty_detail: pilot1.decision === "penalty" ? pilot1.penaltyDetail || null : null,
        },
        {
          pilot_number: pilot2.pilotNumber.trim(),
          decision_type: pilot2.decision!,
          penalty_detail: pilot2.decision === "penalty" ? pilot2.penaltyDetail || null : null,
        },
      ]);
    } finally {
      setDeciding(false);
    }
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

        {/* Pilots reported by marshal — read-only reference */}
        <div>
          <div className="label-caps mb-1 text-text-3">Пилоты (из доклада маршала)</div>
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
        {(payload.transcript_raw || payload.free_text) && (
          <blockquote className="m-0 rounded border-l-2 border-border-strong bg-surface-2 px-3 py-2 text-[12px] italic leading-relaxed text-text-2">
            «{payload.transcript_raw ?? payload.free_text}»
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

        {/* ── Решение судьи ─────────────────────────────────────────────── */}
        <div className="mt-1">
          <div className="label-caps mb-2">Решение судьи</div>

          {/* Mode toggle */}
          <div className="mb-3 flex rounded-md border border-border bg-surface-2 p-0.5">
            <button
              onClick={() => setMode("single")}
              disabled={deciding}
              className={`flex-1 rounded py-1.5 text-[12px] font-semibold transition-colors
                ${mode === "single"
                  ? "bg-surface shadow-sm text-text"
                  : "text-text-3 hover:text-text-2"}`}
            >
              Одному пилоту
            </button>
            <button
              onClick={() => setMode("split")}
              disabled={deciding || !onDecideSplit}
              className={`flex-1 rounded py-1.5 text-[12px] font-semibold transition-colors
                ${mode === "split"
                  ? "bg-surface shadow-sm text-text"
                  : "text-text-3 hover:text-text-2"}
                disabled:opacity-40`}
            >
              Разделить (2 пилота)
            </button>
          </div>

          {mode === "single" && (
            <>
              {/* Pilot number override */}
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[12px] text-text-2 whitespace-nowrap">Назначить пилоту №</span>
                <input
                  type="text"
                  value={assignedPilot}
                  onChange={(e) => setAssignedPilot(e.target.value)}
                  placeholder={payload.pilot_numbers.join(", ") || "номер"}
                  disabled={deciding}
                  className="w-24 rounded-md border border-border bg-surface-2 px-2 py-1.5 text-[13px] font-mono font-bold text-text
                             placeholder:text-text-mute focus:border-brand-500 focus:outline-none
                             focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 transition-colors"
                />
              </div>

              {/* Penalty detail */}
              <input
                type="text"
                placeholder="Детали штрафа (+5 сек, проезд через пит-лейн…)"
                value={penaltyDetail}
                onChange={(e) => setPenaltyDetail(e.target.value)}
                disabled={deciding}
                className="mb-2 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-[13px] text-text
                           placeholder:text-text-mute focus:border-brand-500 focus:outline-none
                           focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 transition-colors"
              />

              {/* Decision buttons */}
              <div className="flex gap-2">
                <button
                  disabled={deciding}
                  onClick={() => handleSingleDecide("penalty")}
                  className="flex-1 rounded-md bg-emergency py-2 text-[12.5px] font-bold text-white
                             hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  Штраф
                </button>
                <button
                  disabled={deciding}
                  onClick={() => handleSingleDecide("warning")}
                  className="flex-1 rounded-md bg-warning py-2 text-[12.5px] font-bold text-white
                             hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  Предупр.
                </button>
                <button
                  disabled={deciding}
                  onClick={() => handleSingleDecide("dismiss")}
                  className="flex-1 rounded-md border border-border bg-surface-2 py-2 text-[12.5px] font-semibold text-text-2
                             hover:bg-surface hover:border-border-strong disabled:opacity-50 transition-colors"
                >
                  Снять
                </button>
              </div>
            </>
          )}

          {mode === "split" && (
            <>
              <div className="flex flex-col gap-2 mb-3">
                <PilotDecisionRow
                  label="Пилот 1"
                  state={pilot1}
                  onChange={setPilot1}
                  disabled={deciding}
                />
                <PilotDecisionRow
                  label="Пилот 2"
                  state={pilot2}
                  onChange={setPilot2}
                  disabled={deciding}
                />
              </div>
              <button
                disabled={deciding || !splitReady}
                onClick={handleSplitDecide}
                className="w-full rounded-md bg-brand-500 py-2.5 text-[12.5px] font-bold text-white
                           hover:bg-brand-600 disabled:opacity-40 transition-colors"
              >
                {deciding ? "Сохранение…" : "Применить оба решения"}
              </button>
              {!splitReady && !deciding && (
                <p className="mt-1.5 text-center text-[11px] text-text-mute">
                  Укажите номера обоих пилотов и выберите решения
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
