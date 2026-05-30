import type { NextApiRequest, NextApiResponse } from "next";
import { hubBaseUrl, forwardHeaders, withAuthIfSet } from "@/lib/hubProxy";

// Proxy: POST /api/hub/install  ->  POST ${HUB}/catalog/install
//
// Publishes/installs a catalog entity (agent | tool | mcp_server) from an
// inline manifest. This is an admin/mutation endpoint and requires auth on
// protected hubs; the bearer token is forwarded if HUB_API_TOKEN is set.
//
// Expected body (built by the Publish dialog):
//   { id: "<type>:<id>@<version>", target: "<label-or-path>",
//     manifest: { ... }, source_url?: "..." }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  try {
    const base = hubBaseUrl();
    const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
    const r = await fetch(`${base}/catalog/install`, {
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
