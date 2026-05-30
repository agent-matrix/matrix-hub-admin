import React, { useEffect, useState } from 'react';
import { X, Server, Boxes, Loader2, CheckCircle2, AlertCircle, Rocket } from 'lucide-react';
import {
  publishServer,
  publishEntity,
  publishManifest,
  type ArtifactKind,
  type EntityType,
} from '@/lib/ops';

export type PublishTab = 'server' | 'entity';

interface PublishModalProps {
  open: boolean;
  initialTab?: PublishTab;
  onClose: () => void;
  onSuccess?: () => void;
}

type Result = { type: 'success' | 'error'; text: string } | null;

const field =
  'h-11 w-full rounded-xl border border-white/[0.06] bg-black/40 px-3 text-sm text-emerald-50 outline-none transition focus:border-emerald-400/40 placeholder:text-emerald-300/30';
const labelCls = 'mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300/55';

const csv = (s: string) =>
  s
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);

export const PublishModal: React.FC<PublishModalProps> = ({
  open,
  initialTab = 'server',
  onClose,
  onSuccess,
}) => {
  const [tab, setTab] = useState<PublishTab>(initialTab);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>(null);

  // Server form
  const [srv, setSrv] = useState({
    transport: 'SSE' as 'SSE' | 'STDIO' | 'WEBSOCKET' | 'HTTP',
    url: '',
    id: '',
    name: '',
    version: '0.1.0',
    description: '',
    capabilities: '',
  });

  // Entity form
  const [ent, setEnt] = useState({
    type: 'tool' as EntityType,
    id: '',
    name: '',
    version: '0.1.0',
    description: '',
    capabilities: '',
    artifactKind: 'pypi' as ArtifactKind,
    artifactSpec: '',
    artifactVersion: '',
    target: './.matrix/published',
    sourceUrl: '',
  });

  // Advanced (paste manifest JSON) for entity tab
  const [advanced, setAdvanced] = useState(false);
  const [manifestJson, setManifestJson] = useState('');

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setResult(null);
    }
  }, [open, initialTab]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  const finish = (ok: boolean, text: string) => {
    setResult({ type: ok ? 'success' : 'error', text });
    if (ok) onSuccess?.();
  };

  const submitServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!srv.id || !srv.name || !srv.url) {
      return setResult({ type: 'error', text: 'ID, name, and URL are required.' });
    }
    setBusy(true);
    setResult(null);
    const r = await publishServer({
      transport: srv.transport,
      url: srv.url,
      id: srv.id,
      name: srv.name,
      version: srv.version,
      description: srv.description,
      capabilities: csv(srv.capabilities),
    });
    setBusy(false);
    finish(
      r.ok,
      r.ok
        ? `Registered ${srv.name}${r.data?.uid ? ` · uid ${r.data.uid}` : ''}.`
        : r.error || 'Failed to register MCP server.'
    );
  };

  const submitEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setResult(null);

    if (advanced) {
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(manifestJson);
      } catch {
        setBusy(false);
        return setResult({ type: 'error', text: 'Manifest must be valid JSON.' });
      }
      const t = String(parsed.type || ent.type);
      const id = String(parsed.id || ent.id);
      const ver = String(parsed.version || ent.version);
      if (!id) {
        setBusy(false);
        return setResult({ type: 'error', text: 'Manifest needs an "id" field.' });
      }
      const r = await publishManifest(`${t}:${id}@${ver}`, parsed, ent.target, ent.sourceUrl || undefined);
      setBusy(false);
      return finish(r.ok, r.ok ? `Published ${id}@${ver}.` : r.error || 'Publish failed.');
    }

    if (!ent.id || !ent.name) {
      setBusy(false);
      return setResult({ type: 'error', text: 'ID and name are required.' });
    }
    const r = await publishEntity({
      type: ent.type,
      id: ent.id,
      name: ent.name,
      version: ent.version,
      description: ent.description,
      capabilities: csv(ent.capabilities),
      artifactKind: ent.artifactKind,
      artifactSpec: ent.artifactSpec,
      artifactVersion: ent.artifactVersion || undefined,
      target: ent.target,
      sourceUrl: ent.sourceUrl || undefined,
    });
    setBusy(false);
    finish(r.ok, r.ok ? `Published ${ent.type}:${ent.id}@${ent.version}.` : r.error || 'Publish failed.');
  };

  const TabButton = ({ id, icon: Icon, label }: { id: PublishTab; icon: typeof Server; label: string }) => (
    <button
      onClick={() => {
        setTab(id);
        setResult(null);
      }}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
        tab === id
          ? 'bg-emerald-400/12 text-emerald-100 shadow-[0_0_22px_rgba(0,255,136,0.08)]'
          : 'text-emerald-50/55 hover:bg-white/5 hover:text-emerald-100'
      }`}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-[92] grid place-items-end bg-black/70 p-3 backdrop-blur-sm sm:place-items-center sm:p-6"
      onClick={() => !busy && onClose()}
    >
      <div
        className="animate-menu-rise flex max-h-[92svh] w-full max-w-2xl flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#06100B]/95 shadow-[0_0_90px_rgba(0,255,136,0.12)] backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-300">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-emerald-50">Publish to Matrix-Hub</h2>
              <p className="text-xs text-emerald-50/45">Register a server or publish a catalog entity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            className="rounded-xl p-2 text-emerald-100/60 hover:bg-white/5 hover:text-emerald-100 disabled:opacity-40"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/5 px-5 py-3">
          <TabButton id="server" icon={Server} label="MCP Server" />
          <TabButton id="entity" icon={Boxes} label="Tool / Agent" />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {result && (
            <div
              className={`mb-4 flex items-start gap-2 rounded-xl border p-3 text-sm ${
                result.type === 'success'
                  ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200'
                  : 'border-rose-300/20 bg-rose-400/10 text-rose-200'
              }`}
            >
              {result.type === 'success' ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>{result.text}</span>
            </div>
          )}

          {tab === 'server' ? (
            <form className="space-y-4" onSubmit={submitServer}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Transport *</label>
                  <select
                    value={srv.transport}
                    onChange={(e) => setSrv({ ...srv, transport: e.target.value as typeof srv.transport })}
                    className={field}
                  >
                    <option value="SSE">SSE</option>
                    <option value="STDIO">STDIO</option>
                    <option value="WEBSOCKET">WebSocket</option>
                    <option value="HTTP">HTTP</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Endpoint URL *</label>
                  <input
                    value={srv.url}
                    onChange={(e) => setSrv({ ...srv, url: e.target.value })}
                    placeholder="http://10.0.0.12:8080/sse"
                    className={`${field} font-mono`}
                  />
                </div>
                <div>
                  <label className={labelCls}>Server ID *</label>
                  <input
                    value={srv.id}
                    onChange={(e) => setSrv({ ...srv, id: e.target.value })}
                    placeholder="hello-sse-server"
                    className={`${field} font-mono`}
                  />
                </div>
                <div>
                  <label className={labelCls}>Name *</label>
                  <input
                    value={srv.name}
                    onChange={(e) => setSrv({ ...srv, name: e.target.value })}
                    placeholder="Hello SSE Server"
                    className={field}
                  />
                </div>
                <div>
                  <label className={labelCls}>Version</label>
                  <input
                    value={srv.version}
                    onChange={(e) => setSrv({ ...srv, version: e.target.value })}
                    className={`${field} font-mono`}
                  />
                </div>
                <div>
                  <label className={labelCls}>Capabilities</label>
                  <input
                    value={srv.capabilities}
                    onChange={(e) => setSrv({ ...srv, capabilities: e.target.value })}
                    placeholder="search, files"
                    className={field}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  value={srv.description}
                  onChange={(e) => setSrv({ ...srv, description: e.target.value })}
                  rows={2}
                  className={`${field} h-auto resize-none py-2`}
                  placeholder="What this server does…"
                />
              </div>
              <p className="text-xs text-emerald-50/40">
                Calls <span className="font-mono text-emerald-300/70">POST /registry/mcp</span> on the
                hub (registers with the MCP gateway).
              </p>
              <SubmitBar busy={busy} label="Register server" onClose={onClose} />
            </form>
          ) : (
            <form className="space-y-4" onSubmit={submitEntity}>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300/55">
                  <input
                    type="checkbox"
                    checked={advanced}
                    onChange={(e) => setAdvanced(e.target.checked)}
                    className="h-4 w-4 accent-emerald-400"
                  />
                  Paste manifest JSON
                </label>
              </div>

              {advanced ? (
                <textarea
                  value={manifestJson}
                  onChange={(e) => setManifestJson(e.target.value)}
                  rows={10}
                  spellCheck={false}
                  placeholder='{ "schema_version": 1, "type": "tool", "id": "pdf-summarizer", "name": "PDF Summarizer", "version": "1.4.2", "capabilities": ["pdf"], "artifacts": [] }'
                  className={`${field} h-auto resize-y py-2 font-mono text-xs leading-5`}
                />
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelCls}>Type *</label>
                      <select
                        value={ent.type}
                        onChange={(e) => setEnt({ ...ent, type: e.target.value as EntityType })}
                        className={field}
                      >
                        <option value="tool">tool</option>
                        <option value="agent">agent</option>
                        <option value="mcp_server">mcp_server</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>ID *</label>
                      <input
                        value={ent.id}
                        onChange={(e) => setEnt({ ...ent, id: e.target.value })}
                        placeholder="pdf-summarizer"
                        className={`${field} font-mono`}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Name *</label>
                      <input
                        value={ent.name}
                        onChange={(e) => setEnt({ ...ent, name: e.target.value })}
                        placeholder="PDF Summarizer"
                        className={field}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Version</label>
                      <input
                        value={ent.version}
                        onChange={(e) => setEnt({ ...ent, version: e.target.value })}
                        className={`${field} font-mono`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Capabilities</label>
                    <input
                      value={ent.capabilities}
                      onChange={(e) => setEnt({ ...ent, capabilities: e.target.value })}
                      placeholder="pdf, summarize"
                      className={field}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-[0.8fr_1.4fr_0.8fr]">
                    <div>
                      <label className={labelCls}>Artifact</label>
                      <select
                        value={ent.artifactKind}
                        onChange={(e) => setEnt({ ...ent, artifactKind: e.target.value as ArtifactKind })}
                        className={field}
                      >
                        <option value="pypi">pypi</option>
                        <option value="docker">docker</option>
                        <option value="git">git</option>
                        <option value="zip">zip</option>
                        <option value="none">none</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>
                        {ent.artifactKind === 'docker'
                          ? 'Image'
                          : ent.artifactKind === 'git'
                            ? 'Repo URL'
                            : ent.artifactKind === 'zip'
                              ? 'Zip URL'
                              : 'Package'}
                      </label>
                      <input
                        value={ent.artifactSpec}
                        onChange={(e) => setEnt({ ...ent, artifactSpec: e.target.value })}
                        disabled={ent.artifactKind === 'none'}
                        placeholder={
                          ent.artifactKind === 'docker'
                            ? 'org/image:tag'
                            : ent.artifactKind === 'git'
                              ? 'https://github.com/org/repo'
                              : ent.artifactKind === 'zip'
                                ? 'https://…/bundle.zip'
                                : 'pdf-summarizer-agent'
                        }
                        className={`${field} font-mono disabled:opacity-40`}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Pin</label>
                      <input
                        value={ent.artifactVersion}
                        onChange={(e) => setEnt({ ...ent, artifactVersion: e.target.value })}
                        disabled={ent.artifactKind !== 'pypi'}
                        placeholder="==1.4.2"
                        className={`${field} font-mono disabled:opacity-40`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Description</label>
                    <textarea
                      value={ent.description}
                      onChange={(e) => setEnt({ ...ent, description: e.target.value })}
                      rows={2}
                      className={`${field} h-auto resize-none py-2`}
                      placeholder="Short summary shown in the catalog…"
                    />
                  </div>
                </>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Install target</label>
                  <input
                    value={ent.target}
                    onChange={(e) => setEnt({ ...ent, target: e.target.value })}
                    className={`${field} font-mono`}
                  />
                </div>
                <div>
                  <label className={labelCls}>Source URL (optional)</label>
                  <input
                    value={ent.sourceUrl}
                    onChange={(e) => setEnt({ ...ent, sourceUrl: e.target.value })}
                    placeholder="https://raw.githubusercontent.com/…/manifest.json"
                    className={`${field} font-mono`}
                  />
                </div>
              </div>

              <p className="text-xs text-emerald-50/40">
                Calls <span className="font-mono text-emerald-300/70">POST /catalog/install</span> with
                an inline manifest.
              </p>
              <SubmitBar busy={busy} label="Publish entity" onClose={onClose} />
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

function SubmitBar({ busy, label, onClose }: { busy: boolean; label: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-end gap-3 border-t border-white/5 pt-4">
      <button
        type="button"
        onClick={onClose}
        disabled={busy}
        className="rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5 disabled:opacity-40"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-black shadow-[0_0_24px_rgba(0,255,136,0.16)] transition hover:bg-emerald-300 disabled:opacity-60"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {busy ? 'Publishing…' : label}
      </button>
    </div>
  );
}

export default PublishModal;
