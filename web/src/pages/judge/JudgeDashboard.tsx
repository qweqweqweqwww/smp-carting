import { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useWebSocket } from "../../hooks/useWebSocket";
import { useAuth } from "../../contexts/AuthContext";
import { IncidentCard } from "../../components/judge/IncidentCard";
import { EmergencyBanner } from "../../components/common/EmergencyBanner";
import { AppShell } from "../../components/common/AppShell";
import { Pill } from "../../components/common/Pill";
import { KpiCard } from "../../components/common/KpiCard";
import { decideIncident, decideSplitIncident, getIncidents, getProtocol } from "../../api/incidents";
import { getRace } from "../../api/races";
import { VIOLATION_RU, DECISION_RU } from "../../utils/labels";
import type {
  WsMessage, IncidentNewPayload, DecisionType, RaceStatus,
  Incident, ProtocolEntry, SplitDecisionItem,
} from "../../types";

function incidentToPayload(incident: Incident, posts: { id: number; label: string }[]): IncidentNewPayload {
  const post = posts.find((p) => p.id === incident.post_id);
  return {
    incident_id: incident.id,
    pilot_numbers: incident.pilot_numbers
      ? incident.pilot_numbers.split(",").map((s) => Number(s.trim())).filter((n) => !isNaN(n))
      : [],
    violation_type: incident.violation_type ?? null,
    transcript_raw: incident.transcript_raw ?? null,
    free_text: incident.free_text ?? null,
    is_emergency: incident.is_emergency,
    post_id: incident.post_id,
    post_label: post?.label ?? `Пост ${incident.post_id}`,
    marshal_id: incident.marshal_id,
    audio_url: `/audio/${incident.id}`,
  };
}

export function JudgeDashboard() {
  const { user, sessionToken } = useAuth();
  const { raceId: raceIdParam } = useParams<{ raceId: string }>();
  const navigate = useNavigate();
  const raceId = Number(raceIdParam);

  const [incidents, setIncidents] = useState<IncidentNewPayload[]>([]);
  const [decidedEntries, setDecidedEntries] = useState<ProtocolEntry[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [emergency, setEmergency] = useState<string | null>(null);
  const [raceInfo, setRaceInfo] = useState<{ name: string; status: RaceStatus } | undefined>(undefined);

  // Load initial data on mount
  useEffect(() => {
    if (!raceId) return;
    let cancelled = false;

    const load = async () => {
      const [race, allIncidents, protocol] = await Promise.all([
        getRace(raceId),
        getIncidents(raceId),
        getProtocol(raceId),
      ]);

      if (cancelled) return;

      const racePosts = race.posts ?? [];
      setRaceInfo({ name: race.name, status: race.status });

      const confirmed = allIncidents
        .filter((i) => i.status === "confirmed")
        .map((i) => incidentToPayload(i, racePosts));
      setIncidents(confirmed);
      setSelectedId(confirmed[0]?.incident_id ?? null);
      setDecidedEntries(protocol);
    };

    load().catch(() => {});
    return () => { cancelled = true; };
  }, [raceId]);

  const handleMessage = useCallback((msg: WsMessage) => {
    if (msg.event === "incident.new") {
      const payload = msg.payload as IncidentNewPayload;
      setIncidents((prev) => {
        // dedup: ignore if already in queue (e.g., loaded on mount)
        if (prev.some((i) => i.incident_id === payload.incident_id)) return prev;
        const next = [payload, ...prev.slice(0, 29)];
        setSelectedId((cur) => cur === null ? payload.incident_id : cur);
        return next;
      });
      if (payload.is_emergency) {
        setEmergency(`Пилоты: ${payload.pilot_numbers.join(", ")} — ${payload.free_text ?? ""}`);
      }
    }
  }, []);

  useWebSocket("judge", sessionToken ?? "", handleMessage);

  const handleDecide = useCallback(
    async (incidentId: number, type: DecisionType, penaltyDetail?: string, assignedPilotNumber?: string) => {
      if (!user) return;
      await decideIncident(incidentId, user.id, {
        decision_type: type,
        penalty_detail: penaltyDetail ?? undefined,
        assigned_pilot_number: assignedPilotNumber ?? undefined,
      });
      const incident = incidents.find(i => i.incident_id === incidentId);
      setIncidents((prev) => {
        const next = prev.filter((i) => i.incident_id !== incidentId);
        setSelectedId(next[0]?.incident_id ?? null);
        return next;
      });
      setDecidedEntries((prev) => [{
        id: Date.now(),
        incident_id: incidentId,
        race_id: raceId,
        sequence_number: prev.length + 1,
        pilot_numbers: assignedPilotNumber ?? incident?.pilot_numbers.join(",") ?? "",
        violation_type: "",
        transcript_raw: null,
        decision_type: type,
        penalty_detail: penaltyDetail ?? null,
        post_label: incident?.post_label ?? "",
        marshal_name: "",
        judge_name: user.name,
        created_at: new Date().toISOString(),
      }, ...prev]);
    },
    [user, incidents, raceId]
  );

  const handleDecideSplit = useCallback(
    async (incidentId: number, decisions: SplitDecisionItem[]) => {
      if (!user) return;
      await decideSplitIncident(incidentId, user.id, decisions);
      const incident = incidents.find(i => i.incident_id === incidentId);
      setIncidents((prev) => {
        const next = prev.filter((i) => i.incident_id !== incidentId);
        setSelectedId(next[0]?.incident_id ?? null);
        return next;
      });
      const now = new Date().toISOString();
      setDecidedEntries((prev) => [
        ...decisions.map((d, idx) => ({
          id: Date.now() + idx,
          incident_id: incidentId,
          race_id: raceId,
          sequence_number: prev.length + idx + 1,
          pilot_numbers: d.pilot_number,
          violation_type: "",
          transcript_raw: null,
          decision_type: d.decision_type,
          penalty_detail: d.penalty_detail ?? null,
          post_label: incident?.post_label ?? "",
          marshal_name: "",
          judge_name: user.name,
          created_at: now,
        })),
        ...prev,
      ]);
    },
    [user, incidents, raceId]
  );

  const selected = incidents.find((i) => i.incident_id === selectedId) ?? incidents[0] ?? null;
  const pendingCount = incidents.length;

  return (
    <AppShell raceInfo={raceInfo}>
      {emergency && (
        <EmergencyBanner message={emergency} onDismiss={() => setEmergency(null)} />
      )}

      {/* Back nav */}
      <div className="border-b border-border bg-surface px-7 py-2 flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-[12px] font-medium text-text-3 hover:text-text transition-colors"
        >
          ← К списку гонок
        </button>
      </div>

      {/* KPI strip */}
      <div className="border-b border-border bg-surface px-7 py-3">
        <div className="grid grid-cols-4 gap-3 max-w-2xl">
          <KpiCard label="В очереди" value={pendingCount} tone={pendingCount > 0 ? "warning" : "neutral"} />
          <KpiCard label="Штрафов"   value={decidedEntries.filter(d => d.decision_type === "penalty").length} tone="danger"  />
          <KpiCard label="Предупр."  value={decidedEntries.filter(d => d.decision_type === "warning").length} tone="warning" />
          <KpiCard label="Снято"     value={decidedEntries.filter(d => d.decision_type === "dismiss").length} tone="success" />
        </div>
      </div>

      <div className="flex h-[calc(100vh-120px)] min-h-0">
        {/* Left rail — incident queue + history */}
        <aside className="w-[340px] shrink-0 overflow-auto border-r border-border bg-bg-elev">
          <div className="p-5">
            {/* Pending queue */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="label-eyebrow mb-1">Очередь</div>
                <div className="text-[18px] font-bold leading-tight text-text tracking-tight">
                  {pendingCount > 0 ? `${pendingCount} инцидент${pendingCount > 1 ? "а" : ""}` : "Очередь пуста"}
                </div>
              </div>
              {pendingCount > 0 && <Pill tone="warning">ОЖИДАНИЕ</Pill>}
            </div>

            {incidents.length === 0 ? (
              <div className="rounded-md border border-border bg-surface-2 py-8 text-center text-[12px] text-text-3">
                Инцидентов нет.
                <br />Ожидание сообщений маршалов…
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {incidents.map((inc) => {
                  const isSelected = inc.incident_id === (selected?.incident_id);
                  return (
                    <button
                      key={inc.incident_id}
                      onClick={() => setSelectedId(inc.incident_id)}
                      className={`w-full rounded-md border px-3.5 py-3 text-left transition-all
                        ${isSelected
                          ? "border-brand-500 bg-surface shadow-[0_0_0_3px_rgba(43,135,247,0.14)]"
                          : "border-border bg-transparent hover:bg-surface"
                        }`}
                    >
                      <div className="mb-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {inc.is_emergency && <span className="h-1.5 w-1.5 rounded-full bg-emergency" />}
                          <span className={`font-mono text-[11px] font-bold ${isSelected ? "text-brand-500" : "text-text-2"}`}>
                            #{inc.incident_id}
                          </span>
                          <span className="text-[11px] text-text-3">{inc.post_label}</span>
                        </div>
                      </div>
                      <div className="font-mono tnum text-[18px] font-bold leading-tight text-text">
                        {inc.pilot_numbers.join(" · ") || "—"}
                      </div>
                      <div className="mt-1 text-[12px] text-text-3">
                        {VIOLATION_RU[inc.violation_type ?? ""] ?? inc.violation_type ?? "Нарушение"}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Decided history */}
            {decidedEntries.length > 0 && (
              <div className="mt-5">
                <div className="label-caps mb-3">Принятые решения · {decidedEntries.length}</div>
                <div className="flex flex-col gap-1.5">
                  {[...decidedEntries].reverse().map((d) => {
                    const pill = DECISION_RU[d.decision_type] ?? { tone: "neutral" as const, label: d.decision_type };
                    return (
                      <div key={d.id} className="flex items-center gap-2.5 rounded-md border border-border bg-surface px-3 py-2 text-[11.5px]">
                        <span className="font-mono text-[10.5px] text-text-3 w-8">#{d.incident_id}</span>
                        <Pill tone={pill.tone}>{pill.label}</Pill>
                        {d.pilot_numbers && (
                          <span className="font-mono text-[11px] font-semibold text-text-2">{d.pilot_numbers}</span>
                        )}
                        {d.penalty_detail && (
                          <span className="text-[11px] text-text-3 truncate">{d.penalty_detail}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main — focused incident */}
        <section className="flex-1 overflow-auto p-8">
          {selected ? (
            <>
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <div className="label-eyebrow mb-1">Активный инцидент</div>
                  <h1 className="text-[30px] font-black leading-tight tracking-tight text-text">
                    Инцидент #{selected.incident_id}
                  </h1>
                  <p className="mt-1 text-[13px] text-text-3">
                    {selected.post_label} · {selected.pilot_numbers.join(", ")}
                    {selected.is_emergency && (
                      <span className="ml-2 font-semibold text-emergency">· АВАРИЯ</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const idx = incidents.findIndex(i => i.incident_id === selected.incident_id);
                      if (idx > 0) setSelectedId(incidents[idx - 1].incident_id);
                    }}
                    className="rounded-sm border border-border px-3 py-1.5 text-[12px] font-medium text-text-2 hover:bg-surface-2 transition-colors"
                  >
                    ↑ Предыдущий
                  </button>
                  <button
                    onClick={() => {
                      const idx = incidents.findIndex(i => i.incident_id === selected.incident_id);
                      if (idx < incidents.length - 1) setSelectedId(incidents[idx + 1].incident_id);
                    }}
                    className="rounded-sm border border-border px-3 py-1.5 text-[12px] font-medium text-text-2 hover:bg-surface-2 transition-colors"
                  >
                    Следующий ↓
                  </button>
                </div>
              </div>
              <div className="max-w-2xl">
                <IncidentCard
                  payload={selected}
                  big
                  onDecide={(type, penalty, assignedPilot) =>
                    handleDecide(selected.incident_id, type, penalty, assignedPilot)
                  }
                  onDecideSplit={(decisions) => handleDecideSplit(selected.incident_id, decisions)}
                />
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 text-[48px] text-text-mute">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.5a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <p className="text-[15px] font-semibold text-text-2">Очередь пуста</p>
              <p className="mt-1.5 text-[13px] text-text-3">
                {decidedEntries.length > 0
                  ? `Все инциденты рассмотрены · ${decidedEntries.length} решений принято`
                  : "Сообщения от маршалов появятся здесь в реальном времени"
                }
              </p>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
