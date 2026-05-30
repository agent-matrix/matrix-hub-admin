import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Plus, Trash2, Eye } from 'lucide-react';
import { Button, Badge, PageHeader, statusColor } from '../ui';

interface Remote {
  id?: string;
  name?: string;
  url: string;
  status?: string;
  last_sync?: string;
  items?: number;
}

export const RemotesView: React.FC = () => {
  const [remotes, setRemotes] = useState<Remote[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    try {
      setErr(null);
      const r = await fetch('/api/hub/remotes');
      const t = await r.text();
      if (!r.ok) throw new Error(t);
      const j = JSON.parse(t);
      setRemotes(j?.items || j?.remotes || []);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setErr(message);
      setRemotes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sync = async () => {
    setSyncing(true);
    try {
      const r = await fetch('/api/hub/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (!r.ok) throw new Error(await r.text());
      await load();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setErr(message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Upstream federation"
        title="Index remotes"
        subtitle="Manage upstream catalogs and synchronization schedules."
        actions={
          <>
            <Button variant="secondary" icon={RefreshCw} onClick={sync} disabled={syncing}>
              {syncing ? 'Syncing…' : 'Sync all'}
            </Button>
            <Button variant="primary" icon={Plus}>
              Add remote
            </Button>
          </>
        }
      />

      {err && <div className="text-sm text-rose-300">Remotes error: {err}</div>}

      <div className="overflow-hidden rounded-[1.5rem] border border-white/[0.06] bg-white/[0.02] shadow-xl shadow-black/20 backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-emerald-400/[0.04] text-xs uppercase tracking-[0.16em] text-emerald-300/55">
              <tr>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Remote URL</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Last sync</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-emerald-50/45">
                    Loading remotes…
                  </td>
                </tr>
              ) : remotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-emerald-50/45">
                    No remotes configured.
                  </td>
                </tr>
              ) : (
                remotes.map((remote, idx) => (
                  <tr
                    key={remote.id || remote.url || idx}
                    className="bg-black/20 text-emerald-50/72 transition hover:bg-emerald-400/[0.035]"
                  >
                    <td className="px-4 py-4">
                      <Badge color={statusColor(remote.status)}>
                        {remote.status?.toUpperCase() || 'UNKNOWN'}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 font-medium text-emerald-50">{remote.name || '-'}</td>
                    <td className="px-4 py-4 font-mono text-xs text-emerald-50/48">{remote.url}</td>
                    <td className="px-4 py-4 text-emerald-50/58">{remote.items ?? '-'}</td>
                    <td className="px-4 py-4 text-emerald-50/45">{remote.last_sync || '-'}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="inline-flex gap-2">
                        <button className="rounded-xl border border-white/[0.06] p-2 text-emerald-200 hover:bg-emerald-400/10">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="rounded-xl border border-rose-300/12 p-2 text-rose-200 hover:bg-rose-400/10">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
