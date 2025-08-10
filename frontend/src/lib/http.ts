import axios from "axios";

// Prefer NEXT_PUBLIC_API_BASE (Browser), fallback: server var, final: local dev
const baseURL =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.API_BASE ||
  "http://localhost:5000";

export const http = axios.create({
  baseURL, // e.g. https://dein-backend.onrender.com
  // withCredentials: false, // nur aktivieren, wenn du Cookies benutzt
  timeout: 15000,
});

// Optional: Auth-Header automatisch anhängen
http.interceptors.request.use((config) => {
  // === Attach JWT from localStorage if present ===
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});