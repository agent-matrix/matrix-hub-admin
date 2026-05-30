import type { NextApiRequest, NextApiResponse } from 'next';
import { isDbConfigured } from '@/lib/db';
import { countUsers } from '@/lib/users';

// GET /api/auth/setup-status
// Tells the login screen whether this is a brand-new instance that still needs
// its single root admin. Once a root exists, needsSetup is false forever and
// the signup UI is never shown again.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  if (!isDbConfigured()) {
    return res.status(200).json({ dbConfigured: false, needsSetup: false });
  }
  try {
    const users = await countUsers();
    return res.status(200).json({ dbConfigured: true, needsSetup: users === 0 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return res.status(200).json({ dbConfigured: true, needsSetup: false, error: message });
  }
}
