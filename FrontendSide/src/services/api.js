import axios from "axios";

const api = axios.create({
  // Ensure baseURL ends with /api/ for consistent relative path calls
  baseURL: (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "").endsWith("/api")
    ? (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "") + "/"
    : (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "") + "/api/",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;