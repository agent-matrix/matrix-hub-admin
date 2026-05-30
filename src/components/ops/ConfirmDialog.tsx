import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export interface ConfirmOptions {
  title: string;
  body?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmDialogProps extends ConfirmOptions {
  open: boolean;
  onResolve: (confirmed: boolean) => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
  onResolve,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onResolve(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onResolve]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[95] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={() => onResolve(false)}
    >
      <div
        className="animate-menu-rise w-full max-w-md overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#06100B]/95 p-6 shadow-[0_0_80px_rgba(0,0,0,0.6)] backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
              danger
                ? 'border-rose-300/20 bg-rose-400/10 text-rose-300'
                : 'border-emerald-300/20 bg-emerald-400/10 text-emerald-300'
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-emerald-50">{title}</h3>
            {body && <div className="mt-2 text-sm leading-6 text-emerald-50/60">{body}</div>}
          </div>
          <button
            onClick={() => onResolve(false)}
            className="rounded-xl p-1.5 text-emerald-100/60 hover:bg-white/5 hover:text-emerald-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => onResolve(false)}
            className="rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => onResolve(true)}
            className={`rounded-2xl px-5 py-2.5 text-sm font-semibold transition ${
              danger
                ? 'bg-rose-500 text-white hover:bg-rose-400'
                : 'bg-emerald-400 text-black hover:bg-emerald-300'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
