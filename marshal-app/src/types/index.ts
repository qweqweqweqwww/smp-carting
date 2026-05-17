export type RaceStatus = "draft" | "active" | "finished" | "archived";

export interface Post {
  id: number;
  label: string;
  map_x: number | null;
  map_y: number | null;
}

export interface Race {
  id: number;
  name: string;
  venue: string;
  status: RaceStatus;
}

export type ViolationType =
  | "collision"
  | "track_limits"
  | "false_start"
  | "unsafe_driving"
  | "blocking"
  | "other";

export interface TranscriptResult {
  incident_id: number;
  transcript_raw: string;
  pilot_numbers: number[];
  violation_type: ViolationType | null;
  free_text: string | null;
}

export interface User {
  id: number;
  name: string;
  role: string;
  race_id: number;
  is_active: boolean;
  assigned_post_id: number | null;
  created_at: string;
}

export interface InviteRedeemResponse {
  session_token: string;
  user: User;
}

// Recording state machine
export type RecordingState =
  | "idle"
  | "recording"
  | "uploading"
  | "confirming"
  | "sending"
  | "done"
  | "error";
