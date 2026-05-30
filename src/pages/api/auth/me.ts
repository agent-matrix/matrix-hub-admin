import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/auth/session';

// GET /api/auth/me — returns the current session user, or 401.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: 'unauthorized' });
  return res.status(200).json({
    user: {
      id: session.sub,
      email: session.email,
      fullName: session.name ?? null,
      tenantId: session.tenantId,
      role: session.role,
    },
  });
}
