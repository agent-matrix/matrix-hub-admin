import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  icon?: LucideIcon;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  icon: Icon,
  className = '',
  disabled = false,
  type = 'button',
}) => {
  const baseStyle =
    'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-emerald-400 text-black shadow-[0_0_24px_rgba(0,255,136,0.16)] hover:bg-emerald-300',
    secondary:
      'border border-white/10 bg-black/30 text-emerald-100 hover:bg-emerald-400/10',
    danger:
      'border border-rose-300/20 bg-rose-400/10 text-rose-200 hover:bg-rose-400/20',
    success:
      'border border-emerald-300/20 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20',
    ghost: 'bg-transparent text-emerald-100/70 hover:bg-emerald-400/10 hover:text-emerald-100',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
};
