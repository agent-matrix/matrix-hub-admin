import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession, type SessionClaims } from './session';
import type { Role } from '../users';

const ROLE_RANK: Record<Role, number> = { viewer: 0, member: 1, admin: 2, owner: 3 };

/** Returns the session or sends 401 and returns null. */
export async function requireSession(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<SessionClaims | null> {
  const session = await getSession(req);
  if (!session) {
    res.status(401).json({ error: 'unauthorized' });
    return null;
  }
  return session;
}

/** Require a session whose tenant role is at least `min`. */
export async function requireRole(
  req: NextApiRequest,
  res: NextApiResponse,
  min: Role
): Promise<SessionClaims | null> {
  const session = await requireSession(req, res);
  if (!session) return null;
  const role = (session.role as Role) || 'viewer';
  if (ROLE_RANK[role] < ROLE_RANK[min]) {
    res.status(403).json({ error: 'forbidden', detail: `requires role ${min} or higher` });
    return null;
  }
  return session;
}

export function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export function isValidPassword(pw: unknown): pw is string {
  return typeof pw === 'string' && pw.length >= 8 && pw.length <= 200;
}
