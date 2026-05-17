import { api } from "./client";
import type { TranscriptResult, InviteRedeemResponse, ViolationType, Race, Post } from "../types";

export const getRace = (raceId: number) =>
  api.get<Race & { posts: Post[] }>(`/races/${raceId}`).then((r) => r.data);

export const redeemInvite = (token: string) =>
  api
    .post<InviteRedeemResponse>("/users/invite/redeem", { token })
    .then((r) => r.data);

/**
 * Upload a WAV blob to the server.
 * Returns the ASR + NLP structured transcript for marshal confirmation.
 */
export const uploadAudio = (
  blob: Blob,
  raceId: number,
  postId: number,
  marshalId: number,
  isEmergency = false
): Promise<TranscriptResult> => {
  const form = new FormData();
  form.append("audio", blob, "recording.wav");
  form.append("race_id", String(raceId));
  form.append("post_id", String(postId));
  form.append("marshal_id", String(marshalId));
  form.append("is_emergency", String(isEmergency));
  return api
    .post<TranscriptResult>("/incidents/audio", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

export const confirmIncident = (
  incidentId: number,
  pilotNumbers: number[],
  violationType: ViolationType | null,
  freeText: string | null,
  isEmergency: boolean
) =>
  api
    .post(`/incidents/${incidentId}/confirm`, {
      pilot_numbers: pilotNumbers,
      violation_type: violationType,
      free_text: freeText,
      is_emergency: isEmergency,
    })
    .then((r) => r.data);
