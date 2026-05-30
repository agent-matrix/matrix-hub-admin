import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldCheck, Terminal, Lock, Eye, EyeOff, Mail, User, Building2, Crown } from 'lucide-react';
import { MatrixBackground } from '@/components/layout/MatrixBackground';

const inputWrap =
  'mb-4 flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-black/55 px-4';
const inputCls =
  'h-12 w-full bg-transparent text-emerald-50 outline-none placeholder:text-emerald-300/35';
const labelCls =
  'mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/60';

export default function LoginPage() {
  const router = useRouter();
  const { login, register, isAuthenticated } = useAuth();

  // First-run setup detection: true only while the instance has zero users.
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [unverified, setUnverified] = useState(false);
  const [resent, setResent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace('/overview');
  }, [isAuthenticated, router]);

  // Ask the server whether the single root admin still needs to be created.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/auth/setup-status');
        const j = await r.json().catch(() => ({}));
        if (!cancelled) setNeedsSetup(Boolean(j?.needsSetup));
      } catch {
        if (!cancelled) setNeedsSetup(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function resetMessages() {
    setError('');
    setUnverified(false);
    setResent(false);
  }

  async function handleSignin(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();
    setIsLoading(true);
    const res = await login(email, password);
    setIsLoading(false);
    if (res.ok) router.push('/overview');
    else {
      setError(res.error || 'Sign in failed.');
      setUnverified(res.code === 'email_unverified');
    }
  }

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();
    setIsLoading(true);
    const res = await register({ email, password, fullName, tenantName });
    setIsLoading(false);
    if (res.ok) {
      // Root is auto-verified and signed in — go straight to the console.
      router.push('/overview');
    } else {
      setError(res.error || 'Could not create the root admin.');
    }
  }

  async function resend() {
    setResent(false);
    await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).catch(() => {});
    setResent(true);
  }

  if (isAuthenticated) return null;

  // ---- First-run: create the single root admin ----
  if (needsSetup) {
    return (
      <Shell
        eyebrow="First-run setup"
        title="Create root admin"
        subtitle="This MatrixHub instance has no users yet. Create the single root administrator. This screen appears only once."
      >
        <form
          onSubmit={handleSetup}
          className="rounded-[2rem] border border-white/[0.06] bg-[#06100B]/82 p-6 shadow-[0_0_80px_rgba(0,255,136,0.12)] backdrop-blur-xl"
        >
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">
            <Crown className="h-5 w-5 shrink-0 text-emerald-300" />
            The root admin has full control and can create all other users.
          </div>
          {error && (
            <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          <label className={labelCls}>Full name</label>
          <div className={inputWrap}>
            <User className="h-4 w-4 text-emerald-300" />
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} placeholder="Root Administrator" autoComplete="name" />
          </div>

          <label className={labelCls}>Workspace name</label>
          <div className={inputWrap}>
            <Building2 className="h-4 w-4 text-emerald-300" />
            <input value={tenantName} onChange={(e) => setTenantName(e.target.value)} className={inputCls} placeholder="MatrixHub (optional)" />
          </div>

          <label className={labelCls}>Email</label>
          <div className={inputWrap}>
            <Mail className="h-4 w-4 text-emerald-300" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="root@matrixhub.io" autoComplete="email" required disabled={isLoading} />
          </div>

          <label className={labelCls}>Password</label>
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-black/55 px-4">
            <Lock className="h-4 w-4 text-emerald-300" />
            <input type={visible ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="At least 8 characters" autoComplete="new-password" required disabled={isLoading} />
            <button type="button" onClick={() => setVisible(!visible)} className="text-emerald-200/70 hover:text-emerald-200" aria-label={visible ? 'Hide password' : 'Show password'}>
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <button type="submit" disabled={isLoading} className="h-12 w-full rounded-2xl bg-emerald-400 font-semibold text-black shadow-[0_0_32px_rgba(0,255,136,0.18)] transition hover:bg-emerald-300 disabled:opacity-60">
            {isLoading ? 'Creating root admin…' : 'Create root admin'}
          </button>
        </form>
      </Shell>
    );
  }

  // ---- Normal: sign in only (signup is permanently closed once root exists) ----
  return (
    <Shell
      eyebrow="MatrixHub Admin"
      title="Operator access"
      subtitle="Secure console for catalog, gateway, remotes, entities, and system health."
    >
      <form
        onSubmit={handleSignin}
        className="rounded-[2rem] border border-white/[0.06] bg-[#06100B]/82 p-6 shadow-[0_0_80px_rgba(0,255,136,0.12)] backdrop-blur-xl"
      >
        {error && (
          <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">
            {error}
            {unverified && (
              <button type="button" onClick={resend} className="mt-2 block font-semibold text-emerald-200 underline-offset-2 hover:underline">
                Resend verification email
              </button>
            )}
          </div>
        )}
        {resent && (
          <div className="mb-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">
            If that account exists, a new verification email is on its way.
          </div>
        )}

        <label className={labelCls}>Email</label>
        <div className={inputWrap}>
          <Terminal className="h-4 w-4 text-emerald-300" />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="you@company.com" autoComplete="username" required disabled={isLoading} />
        </div>

        <label className={labelCls}>Password</label>
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-black/55 px-4">
          <Lock className="h-4 w-4 text-emerald-300" />
          <input type={visible ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="••••••••" autoComplete="current-password" required disabled={isLoading} />
          <button type="button" onClick={() => setVisible(!visible)} className="text-emerald-200/70 hover:text-emerald-200" aria-label={visible ? 'Hide password' : 'Show password'}>
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <button type="submit" disabled={isLoading} className="h-12 w-full rounded-2xl bg-emerald-400 font-semibold text-black shadow-[0_0_32px_rgba(0,255,136,0.18)] transition hover:bg-emerald-300 disabled:opacity-60">
          {isLoading ? 'Signing in…' : 'Enter admin console'}
        </button>
        <p className="mt-4 text-center font-mono text-[11px] text-emerald-300/45">
          Accounts are provisioned by an administrator
        </p>
      </form>
    </Shell>
  );
}

function Shell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020403] text-emerald-50">
      <MatrixBackground />
      <div className="relative z-10 grid min-h-screen place-items-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-emerald-300/25 bg-emerald-400/10 shadow-[0_0_50px_rgba(0,255,136,0.18)]">
              <ShieldCheck className="h-8 w-8 text-emerald-300" />
            </div>
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-emerald-300/70">{eyebrow}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-emerald-50">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-emerald-50/58">{subtitle}</p>
          </div>
          {children}
          <p className="mt-8 text-center text-xs text-emerald-50/30">Matrix Hub Admin Console v1.4.2</p>
        </div>
      </div>
    </main>
  );
}
