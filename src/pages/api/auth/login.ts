import type { NextApiRequest, NextApiResponse } from 'next';
import { isDbConfigured } from '@/lib/db';
import { findUserByEmail, getPrimaryMembership, recordLogin } from '@/lib/users';
import { verifyPassword } from '@/lib/auth/crypto';
import { signSession, setSessionCookie } from '@/lib/auth/session';
import { isValidEmail } from '@/lib/auth/guard';

// POST /api/auth/login   Body: { email, password }
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  if (!isDbConfigured()) return res.status(503).json({ error: 'db_not_configured' });

  const { email, password } = req.body || {};
  if (!isValidEmail(email) || typeof password !== 'string')
    return res.status(400).json({ error: 'invalid_credentials' });

  try {
    const user = await findUserByEmail(email);
    // Constant-ish response to avoid user enumeration.
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }
    if (!user.email_verified) {
      return res.status(403).json({ error: 'email_unverified', detail: 'Verify your email first.' });
    }
    if (user.status === 'suspended' || user.status === 'deleted') {
      return res.status(403).json({ error: 'account_disabled' });
    }

    const membership = await getPrimaryMembership(user.id);
    const token = await signSession({
      sub: user.id,
      email: user.email,
      tenantId: membership?.tenant_id ?? null,
      role: membership?.role ?? null,
      name: user.full_name,
    });
    setSessionCookie(res, token);
    await recordLogin(user.id);

    return res.status(200).json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        tenantId: membership?.tenant_id ?? null,
        tenantName: membership?.name ?? null,
        role: membership?.role ?? null,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: 'login_failed', detail: message });
  }
}
