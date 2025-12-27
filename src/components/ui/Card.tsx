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
    className={`bg-[#09090b] border border-white/10 rounded-xl overflow-hidden shadow-xl flex flex-col ${className}`}
  >
    {(title || actions) && (
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          {title}
        </h3>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
    )}
    <div className="p-5 flex-1">{children}</div>
  </div>
);
