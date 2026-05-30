import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ShieldCheck, MailCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { MatrixBackground } from '@/components/layout/MatrixBackground';

type State =
  | { kind: 'loading' }
  | { kind: 'ok' }
  | { kind: 'error'; reason: string };

const REASONS: Record<string, string> = {
  token_invalid: 'This verification link is not valid.',
  token_expired: 'This verification link has expired. Request a new one from the sign-in screen.',
  token_used: 'This email has already been verified. You can sign in now.',
  missing_token: 'No verification token was provided.',
  db_not_configured: 'The user database is not configured on this deployment.',
};

export default function VerifyPage() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    if (!router.isReady) return;
    const token = typeof router.query.token === 'string' ? router.query.token : '';
    if (!token) {
      setState({ kind: 'error', reason: 'missing_token' });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const j = await r.json().catch(() => ({}));
        if (cancelled) return;
        if (r.ok && j?.verified) setState({ kind: 'ok' });
        else setState({ kind: 'error', reason: j?.error || 'token_invalid' });
      } catch {
        if (!cancelled) setState({ kind: 'error', reason: 'token_invalid' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router.isReady, router.query.token]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020403] text-emerald-50">
      <MatrixBackground />
      <div className="relative z-10 grid min-h-screen place-items-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-emerald-300/25 bg-emerald-400/10 shadow-[0_0_50px_rgba(0,255,136,0.18)]">
            <ShieldCheck className="h-8 w-8 text-emerald-300" />
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-emerald-300/70">
            MatrixHub Admin
          </p>

          <div className="mt-6 rounded-[2rem] border border-white/[0.06] bg-[#06100B]/82 p-8 shadow-[0_0_80px_rgba(0,255,136,0.12)] backdrop-blur-xl">
            {state.kind === 'loading' && (
              <div className="flex flex-col items-center gap-3 text-emerald-50/70">
                <Loader2 className="h-7 w-7 animate-spin text-emerald-300" />
                <p>Verifying your email…</p>
              </div>
            )}

            {state.kind === 'ok' && (
              <>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-300/25 bg-emerald-400/10">
                  <MailCheck className="h-7 w-7 text-emerald-300" />
                </div>
                <h1 className="text-2xl font-semibold text-emerald-50">Email verified</h1>
                <p className="mt-3 text-sm leading-6 text-emerald-50/60">
                  Your account is now active. You can sign in to the console.
                </p>
                <Link
                  href="/login"
                  className="mt-6 inline-block h-12 w-full rounded-2xl bg-emerald-400 pt-3 font-semibold text-black hover:bg-emerald-300"
                >
                  Continue to sign in
                </Link>
              </>
            )}

            {state.kind === 'error' && (
              <>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-300/25 bg-rose-400/10">
                  <AlertTriangle className="h-7 w-7 text-rose-300" />
                </div>
                <h1 className="text-2xl font-semibold text-emerald-50">Verification failed</h1>
                <p className="mt-3 text-sm leading-6 text-emerald-50/60">
                  {REASONS[state.reason] || 'Verification failed.'}
                </p>
                <Link
                  href="/login"
                  className="mt-6 inline-block h-12 w-full rounded-2xl border border-white/10 bg-black/35 pt-3 font-semibold text-emerald-100 hover:bg-emerald-400/10"
                >
                  Back to sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
