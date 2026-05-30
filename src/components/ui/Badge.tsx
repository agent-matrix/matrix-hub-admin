import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  color?: 'blue' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'zinc';
}

export const Badge: React.FC<BadgeProps> = ({ children, color = 'emerald' }) => {
  const colors: Record<string, string> = {
    blue: 'border-cyan-300/20 bg-cyan-400/10 text-cyan-200',
    cyan: 'border-cyan-300/20 bg-cyan-400/10 text-cyan-200',
    emerald: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200',
    amber: 'border-amber-300/20 bg-amber-400/10 text-amber-200',
    rose: 'border-rose-300/20 bg-rose-400/10 text-rose-200',
    zinc: 'border-zinc-300/10 bg-zinc-400/10 text-zinc-300',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${
        colors[color] || colors.emerald
      }`}
    >
      {children}
    </span>
  );
};

/** Map a status string to a Badge color, matching the operator-console palette. */
export function statusColor(status?: string): BadgeProps['color'] {
  const v = String(status || '').toUpperCase();
  if (['ACTIVE', 'SYNCED', 'VERIFIED', 'HEALTHY', 'OK', 'OPERATIONAL'].includes(v)) return 'emerald';
  if (['SYNCING', 'REVIEW', 'PENDING'].includes(v)) return 'amber';
  if (['ERROR', 'INACTIVE', 'UNHEALTHY', 'FAILED'].includes(v)) return 'rose';
  return 'zinc';
}
