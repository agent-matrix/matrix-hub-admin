import React from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

/** Consistent module header used across the console views. */
export const PageHeader: React.FC<PageHeaderProps> = ({ eyebrow, title, subtitle, actions }) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      {eyebrow && (
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-emerald-300/65">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-emerald-50">{title}</h2>
      {subtitle && <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/55">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
  </div>
);
