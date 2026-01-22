import React, { useEffect, useState, useCallback } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { Button, Card, Badge } from '../ui';

interface Entity {
  id: string;
  name: string;
  type: string;
  version: string;
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
      const r = await fetch('/api/hub/search?limit=100');
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
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Entity Database</h2>
          <p className="text-zinc-400 text-sm">
            Raw view of all ingested MCP entities.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={RefreshCw} onClick={load} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
          <Button variant="secondary" icon={Download}>
            Export CSV
          </Button>
        </div>
      </div>

      {err && <div className="text-rose-400 text-sm">Error: {err}</div>}

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/5 text-xs text-zinc-500 uppercase">
              <th className="p-4 font-bold">ID</th>
              <th className="p-4 font-bold">Name</th>
              <th className="p-4 font-bold">Type</th>
              <th className="p-4 font-bold">Version</th>
              <th className="p-4 font-bold">Capability</th>
              <th className="p-4 font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-zinc-500">
                  Loading entities...
                </td>
              </tr>
            ) : entities.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-zinc-500">
                  No entities found.
                </td>
              </tr>
            ) : (
              entities.map((ent) => (
                <tr
                  key={ent.id}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="p-4 font-mono text-zinc-500">{ent.id}</td>
                  <td className="p-4 font-medium text-white">{ent.name}</td>
                  <td className="p-4">
                    <Badge>{ent.type || 'UNKNOWN'}</Badge>
                  </td>
                  <td className="p-4 text-zinc-400 font-mono">{ent.version || '-'}</td>
                  <td className="p-4 text-zinc-300">{ent.capability || '-'}</td>
                  <td className="p-4 text-right">
                    <button
                      className="text-blue-400 hover:text-blue-300 text-xs font-bold uppercase"
                      onClick={() => alert('View JSON:\n\n' + JSON.stringify(ent, null, 2))}
                    >
                      View JSON
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
