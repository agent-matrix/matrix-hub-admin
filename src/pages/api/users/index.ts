import type { NextApiRequest, NextApiResponse } from 'next';
import { isDbConfigured } from '@/lib/db';
import { listTenantMembers, createUserByAdmin, findUserByEmail, type Role } from '@/lib/users';
import { sendVerificationEmail } from '@/lib/email';
import { requireSession, requireRole, isValidEmail, isValidPassword } from '@/lib/auth/guard';

const ROLES: Role[] = ['owner', 'admin', 'member', 'viewer'];

// GET  /api/users  — list members of the caller's tenant
// POST /api/users  — admin creates a user { email, password, fullName?, role }
//                    (on-prem: only admins create users; new users must verify
//                    their email before they can sign in).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isDbConfigured()) return res.status(503).json({ error: 'db_not_configured' });

  if (req.method === 'GET') {
    const session = await requireSession(req, res);
    if (!session) return;
    if (!session.tenantId) return res.status(200).json({ items: [] });
    try {
      const items = await listTenantMembers(session.tenantId);
      return res.status(200).json({ items });
    } catch (e) {
      return res.status(500).json({ error: 'list_failed', detail: errMsg(e) });
    }
  }

  if (req.method === 'POST') {
    const session = await requireRole(req, res, 'admin');
    if (!session) return;
    if (!session.tenantId) return res.status(400).json({ error: 'no_tenant' });

    const { email, password, fullName, role } = req.body || {};
    if (!isValidEmail(email)) return res.status(400).json({ error: 'invalid_email' });
    if (!isValidPassword(password))
      return res.status(400).json({ error: 'weak_password', detail: 'Minimum 8 characters.' });
    const safeRole: Role = ROLES.includes(role) ? role : 'member';
    if (safeRole === 'owner') return res.status(400).json({ error: 'cannot_create_owner' });

    try {
      // Reject if the email already belongs to a member of THIS tenant.
      const existing = await findUserByEmail(email);
      if (existing) {
        const members = await listTenantMembers(session.tenantId);
        if (members.some((m) => m.user_id === existing.id)) {
          return res.status(409).json({ error: 'already_member' });
        }
      }

      const { user, verifyToken } = await createUserByAdmin({
        tenantId: session.tenantId,
        email,
        password,
        fullName: fullName ?? null,
        role: safeRole,
      });

      let emailSkipped = false;
      if (verifyToken) {
        const mail = await sendVerificationEmail(email, verifyToken);
        emailSkipped = mail.skipped ?? false;
      }

      return res.status(201).json({
        ok: true,
        userId: user.id,
        needsVerification: !user.email_verified,
        emailSkipped,
      });
    } catch (e) {
      return res.status(500).json({ error: 'create_failed', detail: errMsg(e) });
    }
  }

  return res.status(405).json({ error: 'method_not_allowed' });
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
