import { api } from "./client";
import type { Race, Post } from "../types";

export const getRaces = () => api.get<Race[]>("/races/").then((r) => r.data);
export const getRace = (id: number) => api.get<Race>(`/races/${id}`).then((r) => r.data);
export const createRace = (body: { name: string; venue: string; scheduled_at: string }) =>
  api.post<Race>("/races/", body).then((r) => r.data);
export const startRace = (id: number) => api.post<Race>(`/races/${id}/start`).then((r) => r.data);
export const finishRace = (id: number) => api.post<Race>(`/races/${id}/finish`).then((r) => r.data);

export const updateRace = (id: number, body: { name?: string; venue?: string }) =>
  api.patch<Race>(`/races/${id}`, body).then((r) => r.data);

export const createPost = (raceId: number, body: { label: string; map_x?: number; map_y?: number }) =>
  api.post<Post>(`/races/${raceId}/posts`, body).then((r) => r.data);
export const updatePost = (raceId: number, postId: number, body: Partial<Post>) =>
  api.patch<Post>(`/races/${raceId}/posts/${postId}`, body).then((r) => r.data);
export const deletePost = (raceId: number, postId: number) =>
  api.delete(`/races/${raceId}/posts/${postId}`);
