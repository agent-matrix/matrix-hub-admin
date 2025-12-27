import React from 'react';
import { Activity, CheckCircle } from 'lucide-react';
import { Card } from '../ui';

export const HealthView: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <Card className="col-span-full md:col-span-2 lg:col-span-2">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
          <Activity size={32} />
        </div>
        <div>
          <div className="text-lg font-bold text-white">
            System Status: HEALTHY
          </div>
          <div className="text-sm text-zinc-400">
            All core services are operational.
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 rounded-lg p-3 border border-white/5">
          <div className="text-xs text-zinc-500 uppercase mb-1">Hub API</div>
          <div className="text-emerald-400 font-bold flex items-center gap-2">
            <CheckCircle size={14} /> Operational
          </div>
        </div>
        <div className="bg-zinc-900 rounded-lg p-3 border border-white/5">
          <div className="text-xs text-zinc-500 uppercase mb-1">Gateway</div>
          <div className="text-emerald-400 font-bold flex items-center gap-2">
            <CheckCircle size={14} /> Operational
          </div>
        </div>
      </div>
    </Card>

    <Card title="Error Rate (24h)">
      <div className="flex items-end gap-2 h-24 mt-4">
        {[20, 35, 10, 45, 25, 15, 30, 20, 10, 5].map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-rose-500/20 rounded-t hover:bg-rose-500/40 transition-colors cursor-pointer"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="text-right text-xs text-zinc-500 mt-2">0.02% Avg</div>
    </Card>

    <Card title="Throughput">
      <div className="flex items-end gap-2 h-24 mt-4">
        {[40, 65, 70, 55, 85, 90, 75, 60, 50, 80].map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-blue-500/20 rounded-t hover:bg-blue-500/40 transition-colors cursor-pointer"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="text-right text-xs text-zinc-500 mt-2">1.2k req/s</div>
    </Card>
  </div>
);
