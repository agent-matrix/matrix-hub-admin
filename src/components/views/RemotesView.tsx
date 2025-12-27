import React from 'react';
import { RefreshCw, Plus, Trash2 } from 'lucide-react';
import { Button, Card, Badge } from '../ui';
import { MOCK_REMOTES } from '@/lib/mockData';

export const RemotesView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Index Remotes</h2>
          <p className="text-zinc-400 text-sm">
            Manage upstream catalogs and synchronization schedules.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" icon={RefreshCw}>
            Sync All
          </Button>
          <Button variant="primary" icon={Plus}>
            Add Remote
          </Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/5 text-xs text-zinc-500 uppercase">
              <th className="p-4 font-bold">Status</th>
              <th className="p-4 font-bold">Remote URL</th>
              <th className="p-4 font-bold">Items</th>
              <th className="p-4 font-bold">Last Sync</th>
              <th className="p-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {MOCK_REMOTES.map((remote) => (
              <tr
                key={remote.id}
                className="hover:bg-white/[0.02] transition-colors"
              >
                <td className="p-4">
                  {remote.status === 'SYNCED' && (
                    <Badge color="emerald">SYNCED</Badge>
                  )}
                  {remote.status === 'SYNCING' && (
                    <Badge color="blue">SYNCING</Badge>
                  )}
                  {remote.status === 'ERROR' && (
                    <Badge color="rose">ERROR</Badge>
                  )}
                </td>
                <td className="p-4 font-mono text-zinc-300">{remote.url}</td>
                <td className="p-4 text-white font-medium">{remote.items}</td>
                <td className="p-4 text-zinc-500">{remote.last_sync}</td>
                <td className="p-4 text-right">
                  <button className="text-zinc-500 hover:text-rose-400 transition-colors p-2">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
