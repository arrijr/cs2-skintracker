import axios from "axios";

export const http = axios.create({
  // Base URL zeigt direkt auf /api/v1
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 15000,
});

http.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});