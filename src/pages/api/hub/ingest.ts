import type { NextApiRequest, NextApiResponse } from "next";
import { hubBaseUrl, requireHubToken, forwardHeaders } from "@/lib/hubProxy";

interface HubError extends Error {
  statusCode?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  try {
    const token = requireHubToken();
    const base = hubBaseUrl();
    const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
    const r = await fetch(`${base}/catalog/ingest`, {
      method: "POST",
      headers: forwardHeaders(req, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }),
      body,
    });
    const text = await r.text();
    res.status(r.status).setHeader("content-type", r.headers.get("content-type") || "application/json");
    return res.send(text);
  } catch (e: unknown) {
    const err = e as HubError;
    const code = err.statusCode || 500;
    const message = err.message || String(e);
    return res.status(code).json({ error: "admin_proxy_error", detail: message });
  }
}
