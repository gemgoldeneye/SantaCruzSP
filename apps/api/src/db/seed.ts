// Bootstrap seed — runs as the OWNER role (bypasses RLS). Provisions the Zambales
// province hub + the Santa Cruz municipal tenant, the 5 platform roles, and ONE
// superadmin (from SUPERADMIN_* env). A TRUE blank slate: the LGU sets up its own
// roster, committees, zones, TODAs, fees, projects and accounts in-app.
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { hash as argonHash } from '@node-rs/argon2';
import { v7 as uuidv7 } from 'uuid';
import type { OfficeRoleKey } from '@gelabs/sp/contracts';
import * as schema from '@gelabs/sp/data';
import { santaCruzConfig } from '@lgu/santacruz';
import { env } from '../env.js';

const sql = postgres(env.ownerDatabaseUrl, { max: 4 });
const db = drizzle(sql, { schema });

const TENANT = env.defaultTenant;          // 'santacruz-zambales'

const ALL_PERMS = ['page:search', 'page:scan', 'page:sessions', 'page:tracking', 'page:prangkisa', 'page:analytics', 'page:accounts', 'page:roles', 'page:logs', 'documents:create', 'sessions:manage', 'accounts:manage', 'roles:manage'];

interface RoleSeed {
  key: string; name: string; description: string; isStaff: boolean;
  roleKey: string; offices: string[]; memberships: { office: string; officeRole: OfficeRoleKey }[]; permissions: string[];
  /** Staff title shown in the app shell — platform-standard, role-uniform. */
  title: { fil: string; en: string };
}
const ROLES: RoleSeed[] = [
  { key: 'PRESIDING_OFFICER', name: 'Presiding Officer', description: 'Vice Mayor presiding over the Sanggunian — full access.', isStaff: true, roleKey: 'presiding_officer', offices: ['*'], memberships: [], permissions: ALL_PERMS, title: { fil: 'Pangulong Nagdadakila', en: 'Presiding Officer' } },
  { key: 'ADMIN', name: 'Administrator', description: 'System administration — users, roles, and configuration.', isStaff: true, roleKey: 'lgu_admin', offices: ['*'], memberships: [], permissions: ALL_PERMS, title: { fil: 'Administrador', en: 'Administrator' } },
  { key: 'MEMBER', name: 'Councilor (Member)', description: 'Sangguniang Bayan member — votes and advances measures.', isStaff: true, roleKey: 'member', offices: [], memberships: [{ office: 'sanggunian', officeRole: 'approver' }], permissions: ['page:search', 'page:sessions', 'page:tracking', 'page:analytics', 'documents:create'], title: { fil: 'Konsehal', en: 'Councilor' } },
  { key: 'SECRETARIAT', name: 'Secretariat', description: 'SB secretariat — encodes documents, runs sessions, MTOP intake.', isStaff: true, roleKey: 'secretariat', offices: [], memberships: [{ office: 'sanggunian', officeRole: 'encoder' }, { office: 'mtop', officeRole: 'encoder' }, { office: 'treasury', officeRole: 'cashier' }], permissions: ['page:search', 'page:scan', 'page:sessions', 'page:tracking', 'page:prangkisa', 'page:analytics', 'documents:create', 'sessions:manage'], title: { fil: 'Sekretarya', en: 'Secretariat' } },
  { key: 'OPERATOR', name: 'Window Clerk (Operator)', description: 'MTOP/treasury window clerk — read-mostly, cashiering.', isStaff: false, roleKey: 'operator', offices: [], memberships: [{ office: 'mtop', officeRole: 'inspector' }, { office: 'treasury', officeRole: 'cashier' }], permissions: ['page:search', 'page:prangkisa'], title: { fil: 'Klerk', en: 'Clerk' } },
];

async function main(): Promise<void> {
  console.log(`Bootstrapping ${santaCruzConfig.municipality.name}…`);

  // Single standalone tenant — this deployment owns ONE LGU's database. No province
  // hub and no federation data-grants: each LGU is fully isolated in its own DB.
  await db.insert(schema.tenants).values({
    id: TENANT, name: santaCruzConfig.municipality.name, shortName: santaCruzConfig.municipality.shortName, province: santaCruzConfig.municipality.province,
    type: 'municipality', parentTenantId: null, lguClass: santaCruzConfig.tenant.lguClass ?? '4th',
    enabledOffices: ['sanggunian', 'mtop', 'treasury', 'portal', 'mayor_office'],
  }).onConflictDoNothing();

  // ── Roles (admin-facing; carry the platform RBAC mapping) ────────────────────
  for (const r of ROLES) {
    await db.insert(schema.roles).values({
      tenantId: TENANT, key: r.key, name: r.name, description: r.description,
      isStaff: r.isStaff, isSystem: true, permissions: r.permissions,
      roleKey: r.roleKey, offices: r.offices, memberships: r.memberships,
    }).onConflictDoNothing();
  }
  const roleRows = await sql<{ id: string; key: string }[]>`SELECT id, key FROM platform.roles WHERE tenant_id = ${TENANT}`;
  const roleIdByKey = new Map(roleRows.map((r) => [r.key, r.id]));

  // ── ONE superadmin from env (its own password, NOT a demo account) ───────────
  if (!env.superAdminEmail || !env.superAdminPassword) {
    throw new Error('Bootstrap seed requires SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD');
  }
  const admin = ROLES.find((r) => r.roleKey === 'lgu_admin')!;
  const roleId = roleIdByKey.get(admin.key) ?? null;
  const passwordHash = await argonHash(env.superAdminPassword);
  await db.insert(schema.users).values({
    id: uuidv7(), tenantId: TENANT, username: env.superAdminEmail, name: 'System Administrator',
    role: 'lgu_admin', title: admin.title, offices: admin.offices, initials: 'AD',
    passwordHash, roleId, isDemo: false,
  }).onConflictDoNothing();
  // Resolve the actual user id (insert may have conflicted on a prior run) and
  // (re)link role + memberships + RE-APPLY the superadmin password idempotently,
  // so rotating SUPERADMIN_PASSWORD in Jenkins takes effect on the next deploy.
  const rows = await sql<{ id: string }[]>`SELECT id FROM platform.users WHERE tenant_id = ${TENANT} AND username = ${env.superAdminEmail} LIMIT 1`;
  const uid = rows[0]?.id;
  if (uid) {
    await sql`UPDATE platform.users SET role_id = ${roleId}, is_demo = false, password_hash = ${passwordHash} WHERE id = ${uid}`;
    for (const m of admin.memberships) {
      await db.insert(schema.memberships).values({ userId: uid, office: m.office, officeRole: m.officeRole }).onConflictDoNothing();
    }
  }

  console.log(`Bootstrap seed complete. Superadmin: ${env.superAdminEmail} (tenant ${TENANT}). No demo data.`);
  await sql.end();
}

main().catch(async (e) => { console.error(e); await sql.end(); process.exit(1); });
