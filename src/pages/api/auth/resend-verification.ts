import type { NextApiRequest, NextApiResponse } from 'next';
import { isDbConfigured } from '@/lib/db';
import { findUserByEmail, createVerificationToken } from '@/lib/users';
import { sendVerificationEmail } from '@/lib/email';
import { isValidEmail } from '@/lib/auth/guard';

// POST /api/auth/resend-verification  Body: { email }
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  if (!isDbConfigured()) return res.status(503).json({ error: 'db_not_configured' });

  const { email } = req.body || {};
  if (!isValidEmail(email)) return res.status(400).json({ error: 'invalid_email' });

  try {
    const user = await findUserByEmail(email);
    // Always return ok to avoid leaking which emails exist.
    if (user && !user.email_verified) {
      const token = await createVerificationToken(user);
      await sendVerificationEmail(user.email, token);
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: 'resend_failed', detail: message });
  }
}
