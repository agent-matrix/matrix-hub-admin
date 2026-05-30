import React from 'react';
import { UserRound, LogOut, Settings } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  open: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

const ROLE_TONE: Record<string, 'emerald' | 'cyan' | 'amber' | 'zinc'> = {
  owner: 'emerald',
  admin: 'cyan',
  member: 'zinc',
  viewer: 'amber',
};

/** Read-only account profile with quick actions. */
export const AccountModal: React.FC<Props> = ({ open, onClose, onOpenSettings }) => {
  const { user, logout } = useAuth();
  if (!user) return null;

  const initials = (user.username || user.email || 'AD').slice(0, 2).toUpperCase();
  const role = (user.role || 'member').toLowerCase();

  const rows: [string, string][] = [
    ['Email', user.email],
    ['Workspace', user.tenantName || '—'],
    ['User ID', user.id || '—'],
  ];

  return (
    <Modal open={open} onClose={onClose} title="Account" subtitle="Your operator profile" icon={UserRound}>
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-300/25 bg-emerald-400/10 font-mono text-lg font-semibold text-emerald-200">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-emerald-50">{user.username}</p>
          <div className="mt-1">
            <Badge color={ROLE_TONE[role] || 'zinc'}>{role.toUpperCase()}</Badge>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {rows.map(([k, v]) => (
          <div
            key={k}
            className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-black/30 px-4 py-2.5"
          >
            <span className="text-xs uppercase tracking-[0.16em] text-emerald-300/55">{k}</span>
            <span className="truncate font-mono text-sm text-emerald-50/80">{v}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={onOpenSettings}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/10"
        >
          <Settings className="h-4 w-4" /> Settings
        </button>
        <button
          onClick={() => {
            onClose();
            logout();
          }}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-2.5 text-sm font-semibold text-rose-200 transition hover:bg-rose-400/20"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>
    </Modal>
  );
};

export default AccountModal;
