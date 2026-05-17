// ---------------------------------------------------------------
// Domain types — mirror the server Pydantic schemas
// ---------------------------------------------------------------

export type RaceStatus = "draft" | "active" | "finished" | "archived";
export type UserRole = "admin" | "marshal" | "judge" | "secretary";
export type ViolationType =
  | "collision"
  | "track_limits"
  | "false_start"
  | "unsafe_driving"
  | "blocking"
  | "other";
export type IncidentStatus =
  | "pending_confirm"
  | "confirmed"
  | "decided"
  | "dismissed";
export type DecisionType = "penalty" | "warning" | "dismiss";

export interface Race {
  id: number;
  name: string;
  venue: string;
  scheduled_at: string;
  status: RaceStatus;
  created_at: string;
  posts: Post[];
}

export interface Post {
  id: number;
  race_id: number;
  label: string;
  map_x: number | null;
  map_y: number | null;
}

export interface User {
  id: number;
  name: string;
  role: UserRole;
  race_id: number | null;
  is_active: boolean;
  has_session: boolean;
  assigned_post_id: number | null;
  created_at: string;
}

export interface InviteRead {
  invite_url: string;
  qr_code_url: string;
  expires_at: string;
}

export interface Incident {
  id: number;
  race_id: number;
  post_id: number;
  marshal_id: number;
  transcript_raw: string | null;
  pilot_numbers: string | null;
  violation_type: ViolationType | null;
  free_text: string | null;
  status: IncidentStatus;
  is_emergency: boolean;
  reported_at: string;
  confirmed_at: string | null;
  audio_file_id: number | null;
}

export interface Decision {
  id: number;
  incident_id: number;
  judge_id: number;
  decision_type: DecisionType;
  penalty_detail: string | null;
  notes: string | null;
  decided_at: string;
}

export interface ProtocolEntry {
  id: number;
  incident_id: number;
  race_id: number;
  sequence_number: number;
  pilot_numbers: string;
  violation_type: string;
  transcript_raw: string | null;
  decision_type: string;
  penalty_detail: string | null;
  post_label: string;
  marshal_name: string;
  judge_name: string;
  created_at: string;
}

// ---------------------------------------------------------------
// WebSocket event payloads
// ---------------------------------------------------------------

export interface WsMessage<T = unknown> {
  event: string;
  payload: T;
}

export interface IncidentNewPayload {
  incident_id: number;
  pilot_numbers: number[];
  violation_type: ViolationType | null;
  free_text: string | null;
  is_emergency: boolean;
  post_id: number;
  post_label: string;
  marshal_id: number;
  audio_url: string;
}

export interface ProtocolNewPayload {
  incident_id: number;
  sequence_number: number;
  pilot_numbers: string;
  violation_type: string;
  transcript_raw: string | null;
  decision_type: string;
  penalty_detail: string | null;
  post_label: string;
}
