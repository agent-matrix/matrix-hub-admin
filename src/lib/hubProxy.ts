import type { NextApiRequest } from "next";

export function hubBaseUrl(): string {
  return (process.env.HUB_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
}

export function hubToken(): string {
  return process.env.HUB_API_TOKEN || "";
}

export function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

export function requireHubToken(): string {
  const t = hubToken();
  if (!t) {
    const hint =
      "Missing HUB_API_TOKEN on server. Admin endpoints are protected in Matrix-Hub. " +
      "Set HUB_API_TOKEN for matrix-hub-admin (operator-only deployment).";
    throw Object.assign(new Error(hint), { statusCode: 500 });
  }
  return t;
}

export function forwardHeaders(req: NextApiRequest, extra?: Record<string, string>) {
  const h: Record<string, string> = {
    Accept: "application/json",
    ...(extra || {}),
  };
  if (req.headers["x-request-id"]) {
    h["X-Request-ID"] = String(req.headers["x-request-id"]);
  }
  return h;
}
