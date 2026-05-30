import type { NextApiRequest, NextApiResponse } from 'next';
import { isDbConfigured } from '@/lib/db';
import { registerOwner, countUsers, getPrimaryMembership } from '@/lib/users';
import { isValidEmail, isValidPassword } from '@/lib/auth/guard';
import { signSession, setSessionCookie } from '@/lib/auth/session';

// POST /api/auth/register
//
// On-prem policy: this is NOT public signup. It runs exactly once — on first
// boot, when the instance has zero users — to create the single ROOT admin.
// After a root exists it always returns 403 signup_disabled. The root is
// created verified + active and is signed in immediately (session cookie).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  if (!isDbConfigured()) return res.status(503).json({ error: 'db_not_configured' });

  try {
    // First-run gate: once a root admin exists, signup is permanently closed.
    if ((await countUsers()) > 0) {
      return res.status(403).json({ error: 'signup_disabled' });
    }

    const { email, password, fullName, tenantName } = req.body || {};
    if (!isValidEmail(email)) return res.status(400).json({ error: 'invalid_email' });
    if (!isValidPassword(password))
      return res.status(400).json({ error: 'weak_password', detail: 'Minimum 8 characters.' });

    const { user, tenant } = await registerOwner({
      email,
      password,
      fullName: fullName ?? null,
      tenantName: tenantName ?? null,
    });

    // Sign the root in immediately.
    const membership = await getPrimaryMembership(user.id);
    const token = await signSession({
      sub: user.id,
      email: user.email,
      tenantId: tenant.id,
      role: membership?.role ?? 'owner',
      name: user.full_name,
    });
    setSessionCookie(res, token);

    return res.status(201).json({
      ok: true,
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        tenantId: tenant.id,
        tenantName: tenant.name,
        role: membership?.role ?? 'owner',
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: 'register_failed', detail: message });
  }
}
