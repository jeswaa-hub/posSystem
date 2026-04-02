import axios from "axios";

const api = axios.create({
  // [PRODUCTION_ELEMENT_REMOVED]: Hardcoded production fallback URL moved to ForProduction.md
  // Timestamp: 2026-03-08 | Reason: Centralizing production URLs in ForProduction.md.
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;