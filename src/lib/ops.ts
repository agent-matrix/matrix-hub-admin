// Thin client helpers for the admin operations (publish / remove). Each call
// goes through the server-side /api/hub/* proxy, which injects the admin token.

export interface ApiResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
}

async function parse<T>(r: Response): Promise<ApiResult<T>> {
  const text = await r.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text || null;
  }
  const error = !r.ok
    ? (data && typeof data === 'object' && 'detail' in (data as Record<string, unknown>)
        ? String((data as Record<string, unknown>).detail)
        : typeof data === 'string'
          ? data
          : `HTTP ${r.status}`)
    : undefined;
  return { ok: r.ok, status: r.status, data: (data as T) ?? null, error };
}

export async function postJson<T = unknown>(url: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    });
    return parse<T>(r);
  } catch (e) {
    return { ok: false, status: 0, data: null, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function deleteReq<T = unknown>(url: string): Promise<ApiResult<T>> {
  try {
    const r = await fetch(url, { method: 'DELETE' });
    return parse<T>(r);
  } catch (e) {
    return { ok: false, status: 0, data: null, error: e instanceof Error ? e.message : String(e) };
  }
}

// ----- typed operation payloads ----- //

export interface ServerPublishInput {
  transport: 'SSE' | 'STDIO' | 'WEBSOCKET' | 'HTTP';
  url: string;
  id: string;
  name: string;
  version: string;
  description: string;
  capabilities: string[];
}

/** Register/publish a live MCP server -> POST /registry/mcp */
export function publishServer(input: ServerPublishInput) {
  return postJson<{ uid?: string }>('/api/hub/registry', {
    endpoint: { transport: input.transport, url: input.url },
    id: input.id,
    name: input.name,
    version: input.version,
    description: input.description,
    capabilities: input.capabilities,
  });
}

export type EntityType = 'agent' | 'tool' | 'mcp_server';
export type ArtifactKind = 'pypi' | 'docker' | 'git' | 'zip' | 'none';

export interface EntityPublishInput {
  type: EntityType;
  id: string;
  name: string;
  version: string;
  description: string;
  capabilities: string[];
  artifactKind: ArtifactKind;
  artifactSpec: string;
  artifactVersion?: string;
  target: string;
  sourceUrl?: string;
}

function artifactFrom(kind: ArtifactKind, spec: string, version?: string) {
  if (kind === 'none' || !spec.trim()) return [];
  const s = spec.trim();
  const specObj =
    kind === 'pypi'
      ? { package: s, ...(version ? { version } : {}) }
      : kind === 'docker'
        ? { image: s }
        : kind === 'git'
          ? { repo: s }
          : { url: s }; // zip
  return [{ kind, spec: specObj }];
}

export function buildManifest(input: EntityPublishInput) {
  return {
    schema_version: 1,
    type: input.type,
    id: input.id,
    name: input.name,
    version: input.version,
    description: input.description,
    capabilities: input.capabilities,
    artifacts: artifactFrom(input.artifactKind, input.artifactSpec, input.artifactVersion),
  };
}

/** Publish a catalog entity from a built manifest -> POST /catalog/install */
export function publishEntity(input: EntityPublishInput) {
  const manifest = buildManifest(input);
  return publishManifest(`${input.type}:${input.id}@${input.version}`, manifest, input.target, input.sourceUrl);
}

/** Publish a catalog entity from a raw manifest object (advanced / paste JSON). */
export function publishManifest(
  fqid: string,
  manifest: Record<string, unknown>,
  target: string,
  sourceUrl?: string
) {
  return postJson<{ uid?: string }>('/api/hub/install', {
    id: fqid,
    target,
    manifest,
    ...(sourceUrl ? { source_url: sourceUrl } : {}),
  });
}

/** Remove a registered MCP server from the gateway -> DELETE /gateways/pending/{uid} */
export function removeServer(uid: string) {
  return deleteReq(`/api/hub/gateways?uid=${encodeURIComponent(uid)}`);
}
