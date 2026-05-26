import type { NextApiRequest, NextApiResponse } from "next";
import { hubBaseUrl, forwardHeaders, withAuthIfSet } from "@/lib/hubProxy";

// Proxy: GET /api/hub/sync-status?job_id=<id>
//          -> GET ${HUB}/remotes/sync/{job_id}
//
// Used by RemotesView (and the catalog dashboard) to poll the status
// of a sync job kicked off by POST /remotes/sync.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });
  const jobId = typeof req.query.job_id === "string" ? req.query.job_id : "";
  if (!jobId) return res.status(400).json({ error: "missing_job_id" });
  try {
    const base = hubBaseUrl();
    const r = await fetch(`${base}/remotes/sync/${encodeURIComponent(jobId)}`, {
      method: "GET",
      headers: forwardHeaders(req, withAuthIfSet()),
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
