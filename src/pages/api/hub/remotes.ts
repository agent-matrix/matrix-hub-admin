import type { NextApiRequest, NextApiResponse } from "next";
import { hubBaseUrl, requireHubToken, forwardHeaders } from "@/lib/hubProxy";

interface HubError extends Error {
  statusCode?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = requireHubToken();
    const base = hubBaseUrl();

    if (req.method === "GET") {
      const r = await fetch(`${base}/catalog/remotes`, {
        method: "GET",
        headers: forwardHeaders(req, { Authorization: `Bearer ${token}` }),
      });
      const text = await r.text();
      res.status(r.status).setHeader("content-type", r.headers.get("content-type") || "application/json");
      return res.send(text);
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
      const r = await fetch(`${base}/catalog/remotes`, {
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
    }

    if (req.method === "DELETE") {
      const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
      const r = await fetch(`${base}/catalog/remotes`, {
        method: "DELETE",
        headers: forwardHeaders(req, {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }),
        body,
      });
      const text = await r.text();
      res.status(r.status).setHeader("content-type", r.headers.get("content-type") || "application/json");
      return res.send(text);
    }

    return res.status(405).json({ error: "method_not_allowed" });
  } catch (e: unknown) {
    const err = e as HubError;
    const code = err.statusCode || 500;
    const message = err.message || String(e);
    return res.status(code).json({ error: "admin_proxy_error", detail: message });
  }
}
