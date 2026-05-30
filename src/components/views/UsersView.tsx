import React, { useCallback, useEffect, useState } from 'react';
import {
  Users as UsersIcon,
  UserPlus,
  Trash2,
  ShieldCheck,
  MailWarning,
  Crown,
  RefreshCw,
  Database,
} from 'lucide-react';
import { Badge, MetricCard, PageHeader } from '../ui';
import { useOps } from '../ops';
import { useAuth } from '@/contexts/AuthContext';

type Role = 'owner' | 'admin' | 'member' | 'viewer';

interface Member {
  user_id: string;
  email: string;
  full_name: string | null;
  email_verified: boolean;
  status: string;
  role: Role;
  last_login_at: string | null;
  created_at: string;
}

const ROLE_TONE: Record<Role, 'emerald' | 'cyan' | 'amber' | 'zinc'> = {
  owner: 'emerald',
  admin: 'cyan',
  member: 'zinc',
  viewer: 'amber',
};

const fieldClass =
  'h-11 rounded-xl border border-white/[0.06] bg-black/40 px-3 text-sm text-emerald-50 outline-none transition focus:border-emerald-400/40 placeholder:text-emerald-300/30';

export const UsersView: React.FC = () => {
  const { confirm } = useOps();
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<Role>('member');
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch('/api/users');
      if (r.status === 503) {
        setNotConfigured(true);
        setMembers([]);
        return;
      }
      if (r.status === 401) {
        setErr('Sign in with a database-backed account to manage users.');
        setMembers([]);
        return;
      }
      const j = await r.json();
      if (!r.ok) throw new Error(j?.detail || j?.error || `HTTP ${r.status}`);
      setMembers(j.items || []);
      setNotConfigured(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setNotice(null);
    try {
      const r = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, password: newPassword, fullName: newName, role: newRole }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        const map: Record<string, string> = {
          already_member: 'That email is already a member of this workspace.',
          weak_password: 'Password must be at least 8 characters.',
          invalid_email: 'Enter a valid email address.',
          forbidden: 'You need admin rights to create users.',
        };
        throw new Error(map[j?.error] || j?.detail || j?.error || `HTTP ${r.status}`);
      }
      setNotice({
        kind: 'ok',
        text: j.emailSkipped
          ? `Created ${newEmail}. Email delivery isn't configured — the verification link is in the server logs.`
          : `Created ${newEmail}. They must verify their email before signing in.`,
      });
      setNewEmail('');
      setNewName('');
      setNewPassword('');
      setNewRole('member');
      await load();
    } catch (e) {
      setNotice({ kind: 'err', text: e instanceof Error ? e.message : String(e) });
    } finally {
      setCreating(false);
    }
  }

  async function changeRole(m: Member, role: Role) {
    if (role === m.role) return;
    const r = await fetch(`/api/users/${m.user_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (r.ok) {
      setMembers((prev) => prev.map((x) => (x.user_id === m.user_id ? { ...x, role } : x)));
    } else {
      const j = await r.json().catch(() => ({}));
      setNotice({ kind: 'err', text: j?.detail || j?.error || 'Could not change role.' });
    }
  }

  async function remove(m: Member) {
    const ok = await confirm({
      title: `Remove ${m.full_name || m.email}?`,
      body: `They will lose access to this workspace. Their global account is not deleted.`,
      confirmLabel: 'Remove member',
      danger: true,
    });
    if (!ok) return;
    const r = await fetch(`/api/users/${m.user_id}`, { method: 'DELETE' });
    if (r.ok) {
      setMembers((prev) => prev.filter((x) => x.user_id !== m.user_id));
    } else {
      const j = await r.json().catch(() => ({}));
      setNotice({ kind: 'err', text: j?.detail || j?.error || 'Could not remove member.' });
    }
  }

  const total = members.length;
  const verified = members.filter((m) => m.email_verified).length;
  const pending = members.filter((m) => !m.email_verified).length;
  const owners = members.filter((m) => m.role === 'owner').length;

  if (notConfigured) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Access control" title="Users" subtitle="Manage members of your workspace." />
        <div className="rounded-[2rem] border border-white/[0.06] bg-white/[0.02] p-10 text-center backdrop-blur">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-400/10">
            <Database className="h-7 w-7 text-amber-300" />
          </div>
          <h3 className="text-xl font-semibold text-emerald-50">User database not configured</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-emerald-50/55">
            Set <span className="font-mono text-emerald-200">DATABASE_URL</span> (Neon Postgres) and
            run <span className="font-mono text-emerald-200">npm run db:migrate</span>, then sign in
            with a database-backed account to manage members and invitations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Access control"
        title="Users"
        subtitle={`Members of ${user?.tenantName || 'your workspace'} — invite, assign roles, and revoke access.`}
        actions={
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-emerald-400/10"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={UsersIcon} label="Members" value={total} sub="in this workspace" />
        <MetricCard icon={ShieldCheck} label="Verified" value={verified} sub="confirmed email" />
        <MetricCard icon={MailWarning} label="Pending" value={pending} sub="awaiting verification" tone="amber" />
        <MetricCard icon={Crown} label="Owners" value={owners} sub="full control" tone="cyan" />
      </div>

      {/* Create user */}
      <div className="rounded-[2rem] border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-100">
          Create a user
        </h3>
        <p className="mt-1 text-sm text-emerald-50/52">
          Admins provision accounts directly. The new user must verify their email before they can
          sign in.
        </p>
        {notice && (
          <div
            className={`mt-4 rounded-2xl border p-3 text-sm ${
              notice.kind === 'ok'
                ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200'
                : 'border-rose-300/20 bg-rose-400/10 text-rose-200'
            }`}
          >
            {notice.text}
          </div>
        )}
        <form onSubmit={createUser} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Full name (optional)"
            className={fieldClass}
          />
          <input
            type="email"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="teammate@company.com"
            className={fieldClass}
          />
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Initial password (min 8 chars)"
            autoComplete="new-password"
            className={fieldClass}
          />
          <div className="flex gap-3">
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as Role)}
              className={`${fieldClass} flex-1`}
            >
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 text-sm font-semibold text-black hover:bg-emerald-300 disabled:opacity-60"
            >
              <UserPlus className="h-4 w-4" /> {creating ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>

      {err && <div className="text-sm text-rose-300">{err}</div>}

      {/* Members table */}
      <div className="overflow-hidden rounded-[1.5rem] border border-white/[0.06] bg-white/[0.02] shadow-xl shadow-black/20 backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-emerald-400/[0.04] text-xs uppercase tracking-[0.16em] text-emerald-300/55">
              <tr>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Last login</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-emerald-50/45">
                    Loading members…
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-emerald-50/45">
                    No members yet. Invite your first teammate above.
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.user_id} className="bg-black/20 text-emerald-50/72 transition hover:bg-emerald-400/[0.035]">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-400/10 font-mono text-xs font-semibold text-emerald-200">
                          {(m.full_name || m.email).slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-emerald-50">{m.full_name || m.email.split('@')[0]}</p>
                          <p className="truncate text-xs text-emerald-50/45">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {m.email_verified ? (
                        <Badge color="emerald">VERIFIED</Badge>
                      ) : (
                        <Badge color="amber">PENDING</Badge>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Badge color={ROLE_TONE[m.role]}>{m.role.toUpperCase()}</Badge>
                        <select
                          aria-label="Change role"
                          value={m.role}
                          onChange={(e) => changeRole(m, e.target.value as Role)}
                          className="rounded-lg border border-white/[0.06] bg-black/40 px-2 py-1 text-xs text-emerald-100 outline-none focus:border-emerald-400/40"
                        >
                          <option value="owner">owner</option>
                          <option value="admin">admin</option>
                          <option value="member">member</option>
                          <option value="viewer">viewer</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-emerald-50/45">
                      {m.last_login_at ? new Date(m.last_login_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => remove(m)}
                        className="inline-flex items-center justify-center rounded-xl border border-rose-300/12 p-2 text-rose-200 transition hover:bg-rose-400/10"
                        aria-label="Remove member"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
