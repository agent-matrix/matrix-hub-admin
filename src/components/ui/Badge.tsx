import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'zinc';
}

export const Badge: React.FC<BadgeProps> = ({ children, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    zinc: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  };

  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
        colors[color] || colors.zinc
      }`}
    >
      {children}
    </span>
  );
};
