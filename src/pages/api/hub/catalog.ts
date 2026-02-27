import type { NextApiRequest, NextApiResponse } from "next";
import { hubBaseUrl, forwardHeaders } from "@/lib/hubProxy";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });
  try {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(req.query)) {
      if (typeof v === "string") qs.set(k, v);
    }
    const url = `${hubBaseUrl()}/catalog?${qs.toString()}`;
    const r = await fetch(url, { method: "GET", headers: forwardHeaders(req) });
    const text = await r.text();
    res.status(r.status).setHeader("content-type", r.headers.get("content-type") || "application/json");
    return res.send(text);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return res.status(502).json({ error: "hub_unreachable", detail: message });
  }
}
