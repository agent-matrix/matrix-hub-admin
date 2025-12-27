import React from 'react';
import { Download } from 'lucide-react';
import { Button, Card, Badge } from '../ui';
import { MOCK_ENTITIES } from '@/lib/mockData';

export const EntitiesView: React.FC = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-end">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Entity Database</h2>
        <p className="text-zinc-400 text-sm">
          Raw view of all ingested MCP entities.
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" icon={Download}>
          Export CSV
        </Button>
      </div>
    </div>

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
          {MOCK_ENTITIES.map((ent) => (
            <tr
              key={ent.id}
              className="hover:bg-white/[0.02] transition-colors"
            >
              <td className="p-4 font-mono text-zinc-500">{ent.id}</td>
              <td className="p-4 font-medium text-white">{ent.name}</td>
              <td className="p-4">
                <Badge>{ent.type}</Badge>
              </td>
              <td className="p-4 text-zinc-400 font-mono">{ent.version}</td>
              <td className="p-4 text-zinc-300">{ent.capability}</td>
              <td className="p-4 text-right">
                <button
                  className="text-blue-400 hover:text-blue-300 text-xs font-bold uppercase"
                  onClick={() => alert('View JSON:\n\n' + JSON.stringify(ent, null, 2))}
                >
                  View JSON
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  </div>
);
