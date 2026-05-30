import React, { useEffect, useState, useCallback } from 'react';
import { Download, RefreshCw, Eye } from 'lucide-react';
import { Button, Badge, PageHeader } from '../ui';

interface Entity {
  id: string;
  name: string;
  type: string;
  version: string;
  summary?: string;
  capability?: string;
}

export const EntitiesView: React.FC = () => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setErr(null);
      const r = await fetch('/api/hub/catalog?limit=100');
      const t = await r.text();
      if (!r.ok) throw new Error(t);
      const j = JSON.parse(t);
      setEntities(j?.items || []);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setErr(message);
      setEntities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ingested registry"
        title="Entity database"
        subtitle="Raw view of all ingested MCP entities with versions and capabilities."
        actions={
          <>
            <Button variant="secondary" icon={RefreshCw} onClick={load} disabled={loading}>
              {loading ? 'Loading…' : 'Refresh'}
            </Button>
            <Button variant="secondary" icon={Download}>
              Export CSV
            </Button>
          </>
        }
      />

      {err && <div className="text-sm text-rose-300">Error: {err}</div>}

      <div className="overflow-hidden rounded-[1.5rem] border border-white/[0.06] bg-white/[0.02] shadow-xl shadow-black/20 backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-emerald-400/[0.04] text-xs uppercase tracking-[0.16em] text-emerald-300/55">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Version</th>
                <th className="px-4 py-3">Capability</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-emerald-50/45">
                    Loading entities…
                  </td>
                </tr>
              ) : entities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-emerald-50/45">
                    No entities found.
                  </td>
                </tr>
              ) : (
                entities.map((ent) => (
                  <tr
                    key={ent.id}
                    className="bg-black/20 text-emerald-50/72 transition hover:bg-emerald-400/[0.035]"
                  >
                    <td className="px-4 py-4 font-mono text-xs text-emerald-50/45">{ent.id}</td>
                    <td className="px-4 py-4 font-medium text-emerald-50">{ent.name}</td>
                    <td className="px-4 py-4">
                      <Badge>{ent.type || 'UNKNOWN'}</Badge>
                    </td>
                    <td className="px-4 py-4 font-mono text-emerald-50/58">{ent.version || '-'}</td>
                    <td className="px-4 py-4 text-emerald-50/58">{ent.capability || '-'}</td>
                    <td className="px-4 py-4 text-right">
                      <button
                        className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-400/10"
                        onClick={() => alert('View JSON:\n\n' + JSON.stringify(ent, null, 2))}
                      >
                        <Eye className="h-4 w-4" /> View JSON
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
