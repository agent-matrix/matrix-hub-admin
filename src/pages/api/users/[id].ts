import type { NextApiRequest, NextApiResponse } from 'next';
import { isDbConfigured } from '@/lib/db';
import { removeMember, updateMemberRole, countOwners, getMembership, type Role } from '@/lib/users';
import { requireRole } from '@/lib/auth/guard';

const ROLES: Role[] = ['owner', 'admin', 'member', 'viewer'];

// DELETE /api/users/:id        — remove a member from the tenant (admin+)
// PATCH  /api/users/:id { role } — change a member's role (admin+)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isDbConfigured()) return res.status(503).json({ error: 'db_not_configured' });

  const targetUserId = typeof req.query.id === 'string' ? req.query.id : '';
  if (!targetUserId) return res.status(400).json({ error: 'missing_id' });

  const session = await requireRole(req, res, 'admin');
  if (!session) return;
  if (!session.tenantId) return res.status(400).json({ error: 'no_tenant' });

  // Guard: never strip the tenant's last owner.
  const target = await getMembership(targetUserId, session.tenantId);
  if (!target) return res.status(404).json({ error: 'not_a_member' });

  if (req.method === 'DELETE') {
    if (target.role === 'owner' && (await countOwners(session.tenantId)) <= 1) {
      return res.status(409).json({ error: 'last_owner', detail: 'Assign another owner first.' });
    }
    try {
      const ok = await removeMember(session.tenantId, targetUserId);
      return res.status(ok ? 200 : 404).json({ ok });
    } catch (e) {
      return res.status(500).json({ error: 'remove_failed', detail: errMsg(e) });
    }
  }

  if (req.method === 'PATCH') {
    const role = req.body?.role;
    if (!ROLES.includes(role)) return res.status(400).json({ error: 'invalid_role' });
    if (target.role === 'owner' && role !== 'owner' && (await countOwners(session.tenantId)) <= 1) {
      return res.status(409).json({ error: 'last_owner' });
    }
    try {
      const ok = await updateMemberRole(session.tenantId, targetUserId, role);
      return res.status(ok ? 200 : 404).json({ ok });
    } catch (e) {
      return res.status(500).json({ error: 'role_failed', detail: errMsg(e) });
    }
  }

  return res.status(405).json({ error: 'method_not_allowed' });
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
