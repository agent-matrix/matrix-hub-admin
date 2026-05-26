import type { NextApiRequest } from "next";

// Production default. Override via env when targeting a local Hub or
// a private deployment.
const FALLBACK_BASE = "https://api.matrixhub.io";

/**
 * Resolve the upstream Matrix-Hub base URL.
 *
 * Reads `HUB_URL` (server-only) first, then `NEXT_PUBLIC_HUB_URL` (the
 * env var documented in .env.local.example), and finally falls back to
 * api.matrixhub.io. Trailing slashes are stripped.
 */
export function hubBaseUrl(): string {
  const url =
    process.env.HUB_URL ||
    process.env.NEXT_PUBLIC_HUB_URL ||
    FALLBACK_BASE;
  return url.replace(/\/+$/, "");
}

export function hubToken(): string {
  // Server-side preferred; client-scoped accepted as fallback for
  // operator convenience in single-tenant deployments.
  return process.env.HUB_API_TOKEN || process.env.NEXT_PUBLIC_HUB_TOKEN || "";
}

export function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Returns the token if set, OR throws a 500 with a helpful message.
 * Use ONLY for endpoints the Hub actually requires auth on — today
 * that's primarily POST /registry/mcp on private deployments. Most
 * catalog endpoints (/catalog, /catalog/search, /catalog/entities,
 * GET /remotes, /health, /gateways/pending) are PUBLIC on the
 * production Hub and do not need a token.
 */
export function requireHubToken(): string {
  const t = hubToken();
  if (!t) {
    const hint =
      "Missing HUB_API_TOKEN on server. Set it in .env.local for " +
      "endpoints the Hub requires authentication on (write-side only).";
    throw Object.assign(new Error(hint), { statusCode: 500 });
  }
  return t;
}

/**
 * Returns the token if set, OR an empty string. Use for endpoints that
 * MAY require auth on private deployments but are public on production.
 * Spread `withAuthIfSet()` into the headers map to conditionally include
 * the Authorization header.
 */
export function optionalHubToken(): string {
  return hubToken();
}

/**
 * Returns `{ Authorization: "Bearer ..." }` when a token is set, or `{}`
 * when not. Spread into the forwardHeaders extras to make auth opt-in
 * without an if/else dance in every proxy route.
 */
export function withAuthIfSet(): Record<string, string> {
  const t = hubToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
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
