import axios from "axios";

const baseURL =
  process.env.NEXT_PUBLIC_API_BASE ||
  "https://cs2-skintracker.onrender.com" ||
  "/";

export const http = axios.create({
  baseURL,
  timeout: 15000,
});

http.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
