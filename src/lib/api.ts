// src/lib/api.ts
import axios from "axios";

const HUB_URL = process.env.NEXT_PUBLIC_HUB_URL as string;
const GW_URL  = process.env.NEXT_PUBLIC_GW_URL as string;

export const hub = axios.create({ baseURL: HUB_URL });
export const gw  = axios.create({ baseURL: GW_URL });

hub.interceptors.request.use((config) => {
  const t = typeof window !== "undefined"
    ? (localStorage.getItem("HUB_TOKEN") || process.env.NEXT_PUBLIC_HUB_TOKEN || "")
    : (process.env.NEXT_PUBLIC_HUB_TOKEN || "");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

gw.interceptors.request.use((config) => {
  const t = typeof window !== "undefined"
    ? (localStorage.getItem("GW_TOKEN") || process.env.NEXT_PUBLIC_GW_TOKEN || "")
    : (process.env.NEXT_PUBLIC_GW_TOKEN || "");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});
