// Admin: accounts + roles management (legacy-compatible contracts). lgu_admin /
// executive only. A role carries the legacy permission catalog AND the platform
// RBAC mapping (roleKey + offices + memberships) that is copied onto a user when
// the role is assigned — so a role grant actually drives the office-RBAC the API
// enforces on every mutation.
import type { FastifyInstance } from 'fastify';
import { and, eq, sql as rawSql } from 'drizzle-orm';
import { hash as argonHash } from '@node-rs/argon2';
import { v7 as uuidv7 } from 'uuid';
import { z } from 'zod';
import { isExecutive } from '@gelabs/sp/contracts';
import { db } from '../db/client.js';
import { users, memberships, roles } from '@gelabs/sp/data';
import { requireUser } from '../auth/guard.js';
import { audit } from '../audit.js';
import { withTenant } from '../db/tenant.js';
import { deriveRbac, type Membership } from './rbac-map.js';

const initialsOf = (name: string) => name.replace(/^Hon\.\s*/i, '').split(/\s+/).map((s) => s[0]).join('').slice(0, 3).toUpperCase();

const accountCreate = z.object({ name: z.string().min(1).max(120), email: z.string().min(1).max(120), password: z.string().min(6).max(256), roleId: z.string().uuid() });
const accountPatch = z.object({ name: z.string().min(1).max(120), email: z.string().min(1).max(120), roleId: z.string().uuid(), password: z.string().min(6).max(256).optional() });
const roleCreate = z.object({ key: z.string().min(1).max(64), name: z.string().min(1).max(120), description: z.string().max(400).optional().default(''), isStaff: z.boolean().default(false), permissions: z.array(z.string()).default([]) });
const rolePatch = z.object({ name: z.string().min(1).max(120), description: z.string().max(400).optional().default(''), isStaff: z.boolean().default(false), permissions: z.array(z.string()).default([]) });

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireUser);
  app.addHook('preHandler', async (req, reply) => {
    if (!isExecutive(req.user!)) await reply.code(403).send({ error: 'permission_denied' });
  });

  // Replace a user's memberships with the role's set.
  async function applyRoleToUser(userId: string, role: typeof roles.$inferSelect): Promise<void> {
    await db.update(users).set({ role: role.roleKey, offices: role.offices, roleId: role.id }).where(eq(users.id, userId));
    await db.delete(memberships).where(eq(memberships.userId, userId));
    const mems = (role.memberships ?? []) as Membership[];
    if (mems.length > 0) {
      await db.insert(memberships).values(mems.map((m) => ({ userId, office: m.office, officeRole: m.officeRole as 'head' | 'approver' | 'encoder' | 'cashier' | 'inspector' | 'viewer' })));
    }
  }

  // ── Accounts ────────────────────────────────────────────────────────────────
  app.get('/api/admin/accounts', async (req) => {
    const tenantId = req.tenantId!;
    const rows = await db.execute(rawSql`
      SELECT u.id, u.name, u.username AS email, u.role_id AS "roleId",
             COALESCE(r.name, u.role) AS "roleName", u.is_demo AS "isDemo"
      FROM platform.users u LEFT JOIN platform.roles r ON r.id = u.role_id
      WHERE u.tenant_id = ${tenantId} AND u.status = 'active'
      ORDER BY u.created_at ASC
    `);
    return rows as unknown;
  });

  app.post('/api/admin/accounts', async (req, reply) => {
    const body = accountCreate.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: 'Invalid account details.' });
    const tenantId = req.tenantId!;
    const role = await db.query.roles.findFirst({ where: and(eq(roles.id, body.data.roleId), eq(roles.tenantId, tenantId)) });
    if (!role) return reply.code(400).send({ error: 'Unknown role.' });

    const existing = await db.query.users.findFirst({ where: and(eq(users.tenantId, tenantId), eq(users.username, body.data.email)) });
    if (existing) return reply.code(409).send({ error: 'An account with that email already exists.' });

    const id = uuidv7();
    await db.insert(users).values({
      id, tenantId, username: body.data.email, name: body.data.name, role: role.roleKey,
      title: { fil: role.name, en: role.name }, offices: role.offices, initials: initialsOf(body.data.name),
      passwordHash: await argonHash(body.data.password), roleId: role.id, isDemo: false,
    });
    await applyRoleToUser(id, role);
    await withTenant(tenantId, (tx) => audit({ tenantId, actorId: req.user!.id, actorName: req.user!.name, actorRole: req.user!.role, action: 'admin.account.create', detail: { email: body.data.email } }, tx));
    return reply.code(201).send({ id });
  });

  app.patch('/api/admin/accounts/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = accountPatch.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: 'Invalid account details.' });
    const tenantId = req.tenantId!;
    const role = await db.query.roles.findFirst({ where: and(eq(roles.id, body.data.roleId), eq(roles.tenantId, tenantId)) });
    if (!role) return reply.code(400).send({ error: 'Unknown role.' });

    const set: Partial<typeof users.$inferInsert> = { name: body.data.name, username: body.data.email, initials: initialsOf(body.data.name) };
    if (body.data.password) set.passwordHash = await argonHash(body.data.password);
    await db.update(users).set(set).where(and(eq(users.id, id), eq(users.tenantId, tenantId)));
    await applyRoleToUser(id, role);
    await withTenant(tenantId, (tx) => audit({ tenantId, actorId: req.user!.id, actorName: req.user!.name, actorRole: req.user!.role, action: 'admin.account.update', docId: id }, tx));
    return { ok: true };
  });

  app.delete('/api/admin/accounts/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const tenantId = req.tenantId!;
    if (id === req.user!.id) return reply.code(400).send({ error: 'You cannot delete your own account.' });
    await db.delete(users).where(and(eq(users.id, id), eq(users.tenantId, tenantId)));   // memberships cascade
    await withTenant(tenantId, (tx) => audit({ tenantId, actorId: req.user!.id, actorName: req.user!.name, actorRole: req.user!.role, action: 'admin.account.delete', docId: id }, tx));
    return { ok: true };
  });

  // ── Roles ─────────────────────────────────────────────────────────────────────
  app.get('/api/admin/roles', async (req) => {
    const tenantId = req.tenantId!;
    const rows = await db.execute(rawSql`
      SELECT r.id, r.key, r.name, r.description, r.is_staff AS "isStaff", r.is_system AS "isSystem",
             r.role_key AS "roleKey",
             r.permissions, (SELECT count(*)::int FROM platform.users u WHERE u.role_id = r.id) AS "userCount"
      FROM platform.roles r WHERE r.tenant_id = ${tenantId}
      ORDER BY r.is_system DESC, r.name ASC
    `);
    return rows as unknown;
  });

  app.post('/api/admin/roles', async (req, reply) => {
    const body = roleCreate.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: 'Invalid role details.' });
    const tenantId = req.tenantId!;
    const key = body.data.key.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const dup = await db.query.roles.findFirst({ where: and(eq(roles.tenantId, tenantId), eq(roles.key, key)) });
    if (dup) return reply.code(409).send({ error: 'A role with that key already exists.' });
    const rbac = deriveRbac(body.data.permissions);
    const inserted = await db.insert(roles).values({
      tenantId, key, name: body.data.name, description: body.data.description, isStaff: body.data.isStaff, isSystem: false,
      permissions: body.data.permissions, roleKey: rbac.roleKey, offices: rbac.offices, memberships: rbac.memberships,
    }).returning();
    await withTenant(tenantId, (tx) => audit({ tenantId, actorId: req.user!.id, actorName: req.user!.name, actorRole: req.user!.role, action: 'admin.role.create', detail: { key } }, tx));
    return reply.code(201).send({ id: inserted[0]!.id });
  });

  app.patch('/api/admin/roles/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = rolePatch.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: 'Invalid role details.' });
    const tenantId = req.tenantId!;
    const role = await db.query.roles.findFirst({ where: and(eq(roles.id, id), eq(roles.tenantId, tenantId)) });
    if (!role) return reply.code(404).send({ error: 'Role not found.' });

    const set: Partial<typeof roles.$inferInsert> = { name: body.data.name, description: body.data.description, isStaff: body.data.isStaff, permissions: body.data.permissions };
    // Built-in roles keep their fixed RBAC mapping; custom roles re-derive it.
    if (!role.isSystem) {
      const rbac = deriveRbac(body.data.permissions);
      set.roleKey = rbac.roleKey; set.offices = rbac.offices; set.memberships = rbac.memberships;
    }
    const updated = await db.update(roles).set(set).where(eq(roles.id, id)).returning();
    // Re-apply to every account holding this role so the change takes effect.
    const holders = await db.select({ id: users.id }).from(users).where(eq(users.roleId, id));
    for (const h of holders) await applyRoleToUser(h.id, updated[0]!);
    await withTenant(tenantId, (tx) => audit({ tenantId, actorId: req.user!.id, actorName: req.user!.name, actorRole: req.user!.role, action: 'admin.role.update', docId: id }, tx));
    return { ok: true };
  });

  app.delete('/api/admin/roles/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const tenantId = req.tenantId!;
    const role = await db.query.roles.findFirst({ where: and(eq(roles.id, id), eq(roles.tenantId, tenantId)) });
    if (!role) return reply.code(404).send({ error: 'Role not found.' });
    if (role.isSystem) return reply.code(400).send({ error: 'Built-in roles cannot be deleted.' });
    const holders = await db.select({ id: users.id }).from(users).where(eq(users.roleId, id));
    if (holders.length > 0) return reply.code(400).send({ error: 'Reassign accounts before deleting this role.' });
    await db.delete(roles).where(eq(roles.id, id));
    await withTenant(tenantId, (tx) => audit({ tenantId, actorId: req.user!.id, actorName: req.user!.name, actorRole: req.user!.role, action: 'admin.role.delete', docId: id }, tx));
    return { ok: true };
  });

  // ── Activity log ────────────────────────────────────────────────────────────
  // The append-only, hash-chained audit trail (platform.audit_events): every staff
  // mutation, login, and admin action. Read under tenant RLS, newest first.
  app.get('/api/admin/audit', async (req) => {
    const tenantId = req.tenantId!;
    const q = req.query as { limit?: string; action?: string; actor?: string };
    const limit = Math.min(Math.max(Number(q.limit ?? 200) || 200, 1), 1000);
    const actionFilter = (q.action ?? '').trim();
    const actorFilter = (q.actor ?? '').trim();
    return withTenant(tenantId, async (tx) => {
      const rows = await tx.execute(rawSql`
        SELECT seq, at, actor_id AS "actorId", actor_name AS "actorName", actor_role AS "actorRole",
               action, collection, doc_id AS "docId", detail
        FROM platform.audit_events
        WHERE tenant_id = ${tenantId}
          AND (${actionFilter} = '' OR action ILIKE ${'%' + actionFilter + '%'})
          AND (${actorFilter} = '' OR actor_name ILIKE ${'%' + actorFilter + '%'})
        ORDER BY seq DESC
        LIMIT ${limit}
      `);
      return rows as unknown;
    });
  });
}
