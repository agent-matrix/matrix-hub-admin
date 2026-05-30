import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  actions,
}) => (
  <div
    className={`flex flex-col overflow-hidden rounded-[1.5rem] border border-white/[0.06] bg-white/[0.025] shadow-xl shadow-black/20 backdrop-blur ${className}`}
  >
    {(title || actions) && (
      <div className="flex items-center justify-between border-b border-white/5 bg-emerald-400/[0.03] px-5 py-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-100">
          {title}
        </h3>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
    )}
    <div className="flex-1 p-5">{children}</div>
  </div>
);
