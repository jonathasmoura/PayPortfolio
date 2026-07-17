import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE ?? "https://localhost:7052";
const API_KEY = import.meta.env.VITE_API_KEY;

export const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  if (!API_KEY) return config;

  const headers = config.headers;

  if (headers && typeof headers === "object") {
    (headers as Record<string, unknown>)["X-Api-Key"] = API_KEY;
  }

  return config;
});
