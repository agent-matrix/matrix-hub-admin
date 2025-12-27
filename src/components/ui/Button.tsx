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
    'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20',
    secondary:
      'bg-zinc-800 text-zinc-300 border border-white/10 hover:bg-zinc-700 hover:text-white',
    danger:
      'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20',
    success:
      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20',
    ghost: 'bg-transparent text-zinc-400 hover:text-white hover:bg-white/5',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
};
