import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  tone?: 'emerald' | 'amber' | 'rose' | 'cyan';
  live?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  icon: Icon,
  label,
  value,
  sub,
  tone = 'emerald',
  live = true,
}) => {
  const tones: Record<string, string> = {
    emerald: 'text-emerald-300 bg-emerald-400/10 border-emerald-300/20',
    amber: 'text-amber-300 bg-amber-400/10 border-amber-300/20',
    rose: 'text-rose-300 bg-rose-400/10 border-rose-300/20',
    cyan: 'text-cyan-300 bg-cyan-400/10 border-cyan-300/20',
  };

  return (
    <div className="rounded-[1.5rem] border border-white/[0.06] bg-white/[0.025] p-5 shadow-2xl shadow-black/20 backdrop-blur">
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        {live && <span className="font-mono text-[11px] text-emerald-300/45">LIVE</span>}
      </div>
      <p className="mt-5 text-sm text-emerald-50/55">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-emerald-50">{value}</p>
      {sub && <p className="mt-2 text-xs text-emerald-50/42">{sub}</p>}
    </div>
  );
};
