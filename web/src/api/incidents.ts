import { api } from "./client";
import type { Incident, Decision, ProtocolEntry, SplitDecisionItem } from "../types";
import type { DecisionType } from "../types";

export const getIncidents = (raceId: number) =>
  api.get<Incident[]>("/incidents/", { params: { race_id: raceId } }).then((r) => r.data);


export const decideIncident = (
  incidentId: number,
  judgeId: number,
  body: { decision_type: DecisionType; penalty_detail?: string; notes?: string; assigned_pilot_number?: string }
) =>
  api
    .post<Decision>(`/incidents/${incidentId}/decide`, body, { params: { judge_id: judgeId } })
    .then((r) => r.data);

export const decideSplitIncident = (
  incidentId: number,
  judgeId: number,
  decisions: SplitDecisionItem[]
) =>
  api
    .post<ProtocolEntry[]>(
      `/incidents/${incidentId}/decide-split`,
      { decisions },
      { params: { judge_id: judgeId } }
    )
    .then((r) => r.data);

export const getProtocol = (raceId: number) =>
  api.get<ProtocolEntry[]>("/incidents/protocol", { params: { race_id: raceId } }).then((r) => r.data);

export const exportExcel = (raceId: number) =>
  api.get(`/export/${raceId}/excel`, { responseType: "blob" });

export const exportPdf = (raceId: number) =>
  api.get(`/export/${raceId}/pdf`, { responseType: "blob" });
