import { api } from "./client";
import type { User, InviteRead, UserRole } from "../types";

export const peekInvite = (token: string) =>
  api.get<{ role: string }>("/users/invite/peek", { params: { token } })
    .then((r) => r.data);

export const redeemInvite = (token: string) =>
  api.post<{ session_token: string; user: User }>("/users/invite/redeem", { token })
    .then((r) => r.data);

export const loginUser = (name: string, password: string) =>
  api.post<{ session_token: string; user: User }>("/users/login", { name, password })
    .then((r) => r.data);

export const getUsers = (raceId: number) =>
  api.get<User[]>("/users/", { params: { race_id: raceId } }).then((r) => r.data);

export const getGlobalUsers = () =>
  api.get<User[]>("/users/global").then((r) => r.data);

export const createUser = (body: { name: string; role: UserRole; race_id?: number; password?: string }) =>
  api.post<User>("/users/", body).then((r) => r.data);

export const updateUser = (userId: number, body: { name?: string; is_active?: boolean }) =>
  api.patch<User>(`/users/${userId}`, body).then((r) => r.data);

export const deleteUser = (userId: number) =>
  api.delete(`/users/${userId}`);

export const createInvite = (userId: number, baseUrl: string) =>
  api.post<InviteRead>(`/users/${userId}/invite`, null, { params: { base_url: baseUrl } })
    .then((r) => r.data);

export const assignPost = (userId: number, postId: number) =>
  api.post("/users/assign-post", { user_id: userId, post_id: postId });

export const unassignPost = (userId: number) =>
  api.delete(`/users/${userId}/assign-post`);
