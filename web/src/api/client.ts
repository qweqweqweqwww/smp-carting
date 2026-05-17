import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api/v1";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach session token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("session_token");
  if (token) config.headers["X-Session-Token"] = token;
  return config;
});
