import { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "../../hooks/useWebSocket";
import { useAuth } from "../../contexts/AuthContext";
import { ProtocolTable } from "../../components/secretary/ProtocolTable";
import { AppShell } from "../../components/common/AppShell";
import { KpiCard } from "../../components/common/KpiCard";
import { getRace } from "../../api/races";
import { getProtocol, exportExcel, exportPdf } from "../../api/incidents";
import type { WsMessage, ProtocolEntry, ProtocolNewPayload, RaceStatus } from "../../types";

const FILTERS = ["Все", "Штраф", "Предупр.", "Снято"] as const;
type Filter = typeof FILTERS[number];

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  );
}

export function SecretaryDashboard() {
  const { sessionToken } = useAuth();
  const { raceId: raceIdParam } = useParams<{ raceId: string }>();
  const navigate = useNavigate();
  const RACE_ID = Number(raceIdParam);
  const [liveEntries, setLiveEntries] = useState<ProtocolEntry[]>([]);
  const [filter, setFilter] = useState<Filter>("Все");
  const [search, setSearch] = useState("");
  const [raceInfo, setRaceInfo] = useState<{ name: string; status: RaceStatus } | undefined>(undefined);

  useEffect(() => {
    if (!RACE_ID) return;
    getRace(RACE_ID).then((r) => setRaceInfo({ name: r.name, status: r.status })).catch(() => {});
  }, [RACE_ID]);

  const { data: initialEntries } = useQuery({
    queryKey: ["protocol", RACE_ID],
    queryFn: () => getProtocol(RACE_ID),
    enabled: !!RACE_ID,
  });

  useEffect(() => {
    if (initialEntries) setLiveEntries(initialEntries);
  }, [initialEntries]);

  const handleMessage = useCallback((msg: WsMessage) => {
    if (msg.event === "protocol.new") {
      const payload = msg.payload as ProtocolNewPayload;
      setLiveEntries((prev) => [
        ...prev,
        {
          id: Date.now(),
          incident_id: payload.incident_id,
          race_id: RACE_ID,
          sequence_number: payload.sequence_number,
          pilot_numbers: payload.pilot_numbers,
          violation_type: payload.violation_type,
          transcript_raw: payload.transcript_raw ?? null,
          decision_type: payload.decision_type,
          penalty_detail: payload.penalty_detail,
          post_label: payload.post_label,
          marshal_name: "",
          judge_name: "",
          created_at: new Date().toISOString(),
        } satisfies ProtocolEntry,
      ]);
    }
  }, []);

  useWebSocket("secretary", sessionToken ?? "", handleMessage);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExcelExport = async () => {
    const resp = await exportExcel(RACE_ID);
    downloadBlob(resp.data, `protocol_race_${RACE_ID}.xlsx`);
  };

  const handlePdfExport = async () => {
    const resp = await exportPdf(RACE_ID);
    downloadBlob(resp.data, `protocol_race_${RACE_ID}.pdf`);
  };

  const FILTER_TO_TYPE: Record<Filter, string | null> = {
    "Все": null, "Штраф": "penalty", "Предупр.": "warning", "Снято": "dismiss",
  };

  const penalties = liveEntries.filter(e => e.decision_type === "penalty").length;
  const warnings  = liveEntries.filter(e => e.decision_type === "warning").length;
  const dismissed = liveEntries.filter(e => e.decision_type === "dismiss").length;

  const filtered = liveEntries.filter((e) => {
    const typeMatch = FILTER_TO_TYPE[filter] === null || e.decision_type === FILTER_TO_TYPE[filter];
    const searchMatch = search === "" || e.pilot_numbers.includes(search) ||
      (e.violation_type ?? "").toLowerCase().includes(search.toLowerCase());
    return typeMatch && searchMatch;
  });

  return (
    <AppShell raceInfo={raceInfo}>
      <div className="border-b border-border bg-surface px-7 py-2 flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-[12px] font-medium text-text-3 hover:text-text transition-colors"
        >
          ← К списку гонок
        </button>
      </div>
      <div className="px-7 py-6">
        {/* Page header */}
        <div className="mb-5 flex items-end justify-between">
          <div>
            <div className="label-eyebrow mb-1">Протокол · Live</div>
            <h1 className="text-[26px] font-bold leading-tight tracking-tight text-text">Протокол гонки</h1>
            <p className="mt-1 text-[13px] text-text-3">
              {liveEntries.length} записей · обновляется в реальном времени
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExcelExport}
              className="flex items-center gap-2 rounded-sm border border-border bg-surface px-3.5 py-2 text-[12px] font-semibold text-text-2 hover:bg-surface-2 transition-colors"
            >
              <DownloadIcon />
              Excel
            </button>
            <button
              onClick={handlePdfExport}
              className="flex items-center gap-2 rounded-sm border border-border bg-surface px-3.5 py-2 text-[12px] font-semibold text-text-2 hover:bg-surface-2 transition-colors"
            >
              <DownloadIcon />
              PDF
            </button>
            <button className="flex items-center gap-2 rounded-sm bg-brand-500 px-3.5 py-2 text-[12px] font-bold text-white hover:bg-brand-600 transition-colors">
              <FlagIcon />
              Завершить гонку
            </button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="mb-5 grid grid-cols-5 gap-3">
          <KpiCard label="Записей"  value={liveEntries.length} />
          <KpiCard label="Штрафов"  value={penalties}  tone="danger"   sub={liveEntries.length ? `${Math.round(penalties / liveEntries.length * 100)}%` : undefined} />
          <KpiCard label="Предупр." value={warnings}   tone="warning"  sub={liveEntries.length ? `${Math.round(warnings / liveEntries.length * 100)}%` : undefined} />
          <KpiCard label="Снято"    value={dismissed}  tone="success"  sub={liveEntries.length ? `${Math.round(dismissed / liveEntries.length * 100)}%` : undefined} />
          <KpiCard label="Аварий"   value={liveEntries.filter(e => e.violation_type === "emergency").length} tone="danger" />
        </div>

        {/* Filter bar */}
        <div className="mb-3.5 flex items-center gap-2.5 rounded-md border border-border bg-surface px-4 py-2.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-text-3">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по номеру пилота, типу нарушения…"
            className="flex-1 bg-transparent text-[13.5px] text-text placeholder:text-text-mute focus:outline-none"
          />
          <div className="flex gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full border px-2.5 py-1 text-[11.5px] font-semibold transition-colors
                  ${filter === f
                    ? "border-border bg-surface-2 text-text"
                    : "border-transparent text-text-3 hover:text-text"
                  }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <ProtocolTable entries={filtered} />
      </div>
    </AppShell>
  );
}
