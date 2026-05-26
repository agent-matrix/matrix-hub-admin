import type { NextApiRequest, NextApiResponse } from "next";
import { hubBaseUrl, forwardHeaders, withAuthIfSet } from "@/lib/hubProxy";

// Proxy: POST /api/hub/sync  ->  POST ${HUB}/remotes/sync
//
// BUGFIX: previously called /catalog/remotes/sync which doesn't exist.
// The correct endpoint is /remotes/sync. Returns 202 + job_id with no
// auth required on the production Hub. Pass `?wait=true` through the
// query string for synchronous mode.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  try {
    const base = hubBaseUrl();
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(req.query)) {
      if (typeof v === "string") qs.set(k, v);
    }
    const qstr = qs.toString();
    const url = `${base}/remotes/sync${qstr ? "?" + qstr : ""}`;

    const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
    const r = await fetch(url, {
      method: "POST",
      headers: forwardHeaders(req, {
        "Content-Type": "application/json",
        ...withAuthIfSet(),
      }),
      body,
    });
    const text = await r.text();
    res.status(r.status).setHeader(
      "content-type",
      r.headers.get("content-type") || "application/json",
    );
    return res.send(text);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return res.status(502).json({ error: "hub_unreachable", detail: message });
  }
}
