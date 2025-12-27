import React from 'react';
import { Plus, Settings, Network } from 'lucide-react';
import { Button, Card, Badge } from '../ui';
import { MOCK_GATEWAY } from '@/lib/mockData';

export const GatewayView: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Gateway Routes
            </h2>
            <p className="text-zinc-400 text-sm">
              Active MCP server bridges and connection pools.
            </p>
          </div>
          <Button variant="primary" icon={Plus}>
            Register Server
          </Button>
        </div>

        <div className="grid gap-4">
          {MOCK_GATEWAY.map((gw) => (
            <div
              key={gw.id}
              className="bg-zinc-900 border border-white/5 rounded-xl p-4 flex items-center justify-between hover:border-blue-500/20 transition-all"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    gw.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  <Network size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{gw.name}</span>
                    <Badge color={gw.transport === 'SSE' ? 'blue' : 'amber'}>
                      {gw.transport}
                    </Badge>
                  </div>
                  <div className="text-xs text-zinc-500 font-mono mt-1">
                    {gw.url}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span
                    className={`text-xs font-bold ${
                      gw.status === 'ACTIVE'
                        ? 'text-emerald-500'
                        : 'text-zinc-500'
                    }`}
                  >
                    {gw.status}
                  </span>
                  <span className="text-[10px] text-zinc-600">
                    Uptime: 99.9%
                  </span>
                </div>
                <button className="p-2 text-zinc-500 hover:text-white transition-colors border border-transparent hover:border-white/10 rounded-lg">
                  <Settings size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <Card title="Register New Server">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              alert('Server registration functionality coming soon!');
            }}
          >
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                Server Name
              </label>
              <input
                type="text"
                className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white focus:border-blue-500/50 outline-none"
                placeholder="e.g. weather-service"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                Transport
              </label>
              <select className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white focus:border-blue-500/50 outline-none">
                <option>SSE (Server-Sent Events)</option>
                <option>Stdio (Local Process)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                Endpoint URL / Command
              </label>
              <input
                type="text"
                className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white focus:border-blue-500/50 outline-none"
                placeholder="http://localhost..."
              />
            </div>
            <Button variant="primary" className="w-full justify-center mt-2" type="submit">
              Create Connection
            </Button>
          </form>
        </Card>

        <Card
          title="Traffic Stats"
          className="bg-gradient-to-br from-blue-900/10 to-transparent"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-sm">Requests/min</span>
              <span className="text-white font-mono text-lg">1,240</span>
            </div>
            <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-[65%]" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-sm">Active Streams</span>
              <span className="text-white font-mono text-lg">48</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
