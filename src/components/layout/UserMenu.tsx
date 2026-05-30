import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { ChevronsUpDown, LogOut, Settings, ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * ChatGPT / Claude style account control that lives at the BOTTOM of the left
 * sidebar. Shows the signed-in operator with an avatar; clicking opens a popover
 * (rising upward) with account actions and a logout button.
 */
export const UserMenu: React.FC<{ onNavigate?: () => void }> = ({ onNavigate }) => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click + Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  const initials = (user.username || 'admin').slice(0, 2).toUpperCase();

  const go = (path: string) => {
    setOpen(false);
    onNavigate?.();
    router.push(path);
  };

  const menuItem =
    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-emerald-50/75 transition hover:bg-emerald-400/10 hover:text-emerald-100';

  return (
    <div ref={containerRef} className="relative">
      {/* Popover */}
      {open && (
        <div className="animate-menu-rise absolute bottom-[calc(100%+0.6rem)] left-0 right-0 z-50 overflow-hidden rounded-2xl border border-emerald-300/20 bg-[#06100B]/95 p-2 shadow-[0_0_60px_rgba(0,255,136,0.18)] backdrop-blur-xl">
          <div className="flex items-center gap-3 rounded-xl px-3 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-300/25 bg-emerald-400/10 font-mono text-xs font-semibold text-emerald-200">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-emerald-50">{user.username}</p>
              <p className="truncate text-xs text-emerald-50/45">{user.email}</p>
            </div>
          </div>
          <div className="my-1 h-px bg-emerald-300/10" />
          <button className={menuItem} onClick={() => go('/settings')}>
            <Settings className="h-4 w-4 text-emerald-300" /> Settings
          </button>
          <button className={menuItem} onClick={() => go('/settings')}>
            <KeyRound className="h-4 w-4 text-emerald-300" /> Tokens &amp; secrets
          </button>
          <button className={menuItem} onClick={() => go('/health')}>
            <ShieldCheck className="h-4 w-4 text-emerald-300" /> System health
          </button>
          <div className="my-1 h-px bg-emerald-300/10" />
          <button
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-rose-300/80 transition hover:bg-rose-400/10 hover:text-rose-200"
            onClick={() => {
              setOpen(false);
              logout();
            }}
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      )}

      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
          open
            ? 'border-emerald-300/30 bg-emerald-400/10'
            : 'border-white/[0.06] bg-emerald-400/5 hover:border-emerald-300/25 hover:bg-emerald-400/10'
        }`}
      >
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/25 bg-black font-mono text-sm font-semibold text-emerald-300">
          {initials}
          <span className="pulse-dot absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#020403] bg-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-emerald-50">{user.username}</p>
          <p className="truncate text-xs text-emerald-50/45">{user.email}</p>
        </div>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-emerald-300/60" />
      </button>
    </div>
  );
};

export default UserMenu;
