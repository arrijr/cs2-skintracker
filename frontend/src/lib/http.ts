import axios from "axios";

export const http = axios.create({
  // Base URL zeigt direkt auf /api/v1
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 15000,
});

http.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});