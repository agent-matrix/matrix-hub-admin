import type { NextApiRequest, NextApiResponse } from "next";
import { hubBaseUrl, forwardHeaders, withAuthIfSet } from "@/lib/hubProxy";

// Proxy: POST /api/hub/registry  ->  POST ${HUB}/registry/mcp
//
// This is the most admin-sensitive endpoint (registers an MCP server
// with the Hub + MCP Gateway). On private deployments it typically
// requires auth, but on the public api.matrixhub.io it may be open;
// either way we pass the token through if set, and let the Hub be the
// source of truth on whether auth is required.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  try {
    const base = hubBaseUrl();
    const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
    const r = await fetch(`${base}/registry/mcp`, {
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
