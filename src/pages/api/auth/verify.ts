import type { NextApiRequest, NextApiResponse } from 'next';
import { isDbConfigured } from '@/lib/db';
import { consumeVerificationToken } from '@/lib/users';

// POST /api/auth/verify   Body: { token }
// GET  /api/auth/verify?token=...   (convenience for email links)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET')
    return res.status(405).json({ error: 'method_not_allowed' });
  if (!isDbConfigured()) return res.status(503).json({ error: 'db_not_configured' });

  const token =
    (req.method === 'POST' ? req.body?.token : req.query?.token) &&
    String(req.method === 'POST' ? req.body.token : req.query.token);
  if (!token) return res.status(400).json({ error: 'missing_token' });

  try {
    const result = await consumeVerificationToken(token);
    if (!result.ok) {
      const code = result.reason === 'expired' ? 410 : result.reason === 'used' ? 409 : 400;
      return res.status(code).json({ error: `token_${result.reason}` });
    }
    return res.status(200).json({ ok: true, verified: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: 'verify_failed', detail: message });
  }
}
