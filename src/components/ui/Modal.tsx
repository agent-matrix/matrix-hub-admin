import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, LucideIcon } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Tailwind max-width class for the panel. */
  maxWidth?: string;
}

/**
 * Accessible, theme-consistent modal rendered via a portal to <body>.
 *
 * A portal is required because the sidebar uses `backdrop-blur`, which
 * establishes a containing block and would otherwise trap `fixed` children.
 */
export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  maxWidth = 'max-w-lg',
}) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`animate-menu-rise w-full ${maxWidth} overflow-hidden rounded-[1.75rem] border border-emerald-300/20 bg-[#06100B]/95 shadow-[0_0_80px_rgba(0,255,136,0.16)] backdrop-blur-xl`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/5 px-6 py-5">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-300">
                <Icon className="h-5 w-5" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-emerald-50">{title}</h2>
              {subtitle && <p className="mt-0.5 text-sm text-emerald-50/50">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/[0.06] p-2 text-emerald-100/70 transition hover:bg-emerald-400/10 hover:text-emerald-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-white/5 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
