import type { NextApiRequest, NextApiResponse } from "next";
import { hubBaseUrl, forwardHeaders, withAuthIfSet } from "@/lib/hubProxy";

// Proxy for /gateways/pending — the admin's view of MCP gateway
// registrations that are awaiting approval / activation in MCP-Gateway.
//
// Routes:
//   GET    /api/hub/gateways                    -> GET    /gateways/pending
//   DELETE /api/hub/gateways?uid=<uid>          -> DELETE /gateways/pending/{uid}
//   POST   /api/hub/gateways  (body { uids })   -> POST   /gateways/pending/delete
//
// Public on production matrix-hub today (GET returns 200 without auth);
// auth header is forwarded if HUB_API_TOKEN is set.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const base = hubBaseUrl();
    const auth = withAuthIfSet();

    if (req.method === "GET") {
      const r = await fetch(`${base}/gateways/pending`, {
        method: "GET",
        headers: forwardHeaders(req, auth),
      });
      const text = await r.text();
      res.status(r.status).setHeader(
        "content-type",
        r.headers.get("content-type") || "application/json",
      );
      return res.send(text);
    }

    if (req.method === "DELETE") {
      const uid = typeof req.query.uid === "string" ? req.query.uid : "";
      if (!uid) return res.status(400).json({ error: "missing_uid" });
      const r = await fetch(`${base}/gateways/pending/${encodeURIComponent(uid)}`, {
        method: "DELETE",
        headers: forwardHeaders(req, auth),
      });
      const text = await r.text();
      res.status(r.status).setHeader(
        "content-type",
        r.headers.get("content-type") || "application/json",
      );
      return res.send(text);
    }

    if (req.method === "POST") {
      // Bulk-delete pending gateways: body { uids: ["...", "..."] }
      const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
      const r = await fetch(`${base}/gateways/pending/delete`, {
        method: "POST",
        headers: forwardHeaders(req, { "Content-Type": "application/json", ...auth }),
        body,
      });
      const text = await r.text();
      res.status(r.status).setHeader(
        "content-type",
        r.headers.get("content-type") || "application/json",
      );
      return res.send(text);
    }

    return res.status(405).json({ error: "method_not_allowed" });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return res.status(502).json({ error: "hub_unreachable", detail: message });
  }
}
