// Dev seed — runs as the OWNER role (bypasses RLS). Provisions the Zambales
// province hub + the Santa Cruz municipal tenant, demo staff accounts (the 5 legacy
// roles + admin), and representative reference/demo documents with change_log
// rows so the frontends can pull them.
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { hash as argonHash } from '@node-rs/argon2';
import { v7 as uuidv7 } from 'uuid';
import type { OfficeRoleKey, WorkflowInstance } from '@gelabs/sp/contracts';
import { getWorkflow } from '@gelabs/sp/contracts';
import '@gelabs/sp/modules'; // register SP workflows so getWorkflow() resolves during seeding
import * as schema from '@gelabs/sp/data';
import { santaCruzConfig } from '@lgu/santacruz';
import { env } from '../env.js';

const sql = postgres(env.ownerDatabaseUrl, { max: 4 });
const db = drizzle(sql, { schema });

const PROVINCE = env.provinceTenant;       // 'zambales-province'
const TENANT = env.defaultTenant;             // 'santacruz-zambales'
const PASSWORD = 'demo1234';

// Staff users are DERIVED from the per-LGU `config.demoAccounts` + the platform
// ROLES below (memberships / title / offices come from the account's role) — the
// concrete `USERS` list is built right after ROLES. No municipality names here.
interface DemoUser {
  username: string; name: string; role: string; roleRef: string; initials: string;
  offices: string[]; memberships: { office: string; officeRole: OfficeRoleKey }[];
  title: { fil: string; en: string };
}

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

// Avatar initials from a display name (first letters of the first two words).
function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '??';
}

// Concrete staff accounts to provision — derived from the per-LGU config.demoAccounts,
// with role-driven memberships/title/offices resolved from the platform ROLES above.
const roleByRoleKey = new Map(ROLES.map((r) => [r.roleKey, r]));
const USERS: DemoUser[] = (santaCruzConfig.demoAccounts ?? []).map((a) => {
  const r = roleByRoleKey.get(a.role);
  return {
    username: a.email, name: a.name, role: a.role,
    roleRef: r?.key ?? 'MEMBER',
    initials: a.initials ?? initialsOf(a.name),
    offices: r?.offices ?? [],
    memberships: r?.memberships ?? [],
    title: r?.title ?? { fil: 'Kawani', en: 'Staff' },
  };
});

async function seedDoc(
  tenantId: string, collection: string, ref: string | null, doc: Record<string, unknown>,
): Promise<string> {
  const id = uuidv7();
  await db.insert(schema.documents).values({
    tenantId, collection, id, ref, doc, docVersion: 1, rowVersion: 1,
  });
  await db.insert(schema.changeLog).values({
    tenantId, collection, docId: id, op: 'create', rowVersion: 1, origin: 'seed',
  });
  const wf = doc.wf as WorkflowInstance | undefined;
  if (wf && getWorkflow(wf.def)) {
    const def = getWorkflow(wf.def)!;
    const completed = wf.current >= def.steps.length;
    await db.insert(schema.workflowInstances).values({
      tenantId, collection, docId: id, defKey: wf.def,
      currentStep: wf.current, completed,
      currentOffice: completed ? null : def.steps[wf.current]?.office ?? null,
    });
  }
  return id;
}

const wfAt = (defKey: string, current: number): WorkflowInstance => ({ def: defKey, current, history: [] });

async function main(): Promise<void> {
  console.log(`Seeding ${santaCruzConfig.municipality.province} province + ${santaCruzConfig.municipality.name}…`);

  await db.insert(schema.tenants).values({
    id: PROVINCE, name: `Province of ${santaCruzConfig.municipality.province}`, shortName: santaCruzConfig.municipality.province, province: santaCruzConfig.municipality.province,
    type: 'province', parentTenantId: null, lguClass: '1st',
    enabledOffices: ['sanggunian', 'mtop', 'treasury', 'portal'],
  }).onConflictDoNothing();

  await db.insert(schema.tenants).values({
    id: TENANT, name: santaCruzConfig.municipality.name, shortName: santaCruzConfig.municipality.shortName, province: santaCruzConfig.municipality.province,
    type: 'municipality', parentTenantId: PROVINCE, lguClass: santaCruzConfig.tenant.lguClass ?? '4th',
    enabledOffices: ['sanggunian', 'mtop', 'treasury', 'portal', 'mayor_office'],
  }).onConflictDoNothing();

  // Federation DSA — the province may read Santa Cruz's PUBLIC/up_projection collections
  // only (issued MTOPs, enacted ordinances, projects). Applicant PII, payments,
  // and feedback are local_only and are deliberately NOT granted (confidentialLeak===0).
  await db.insert(schema.dataGrants).values({
    granteeTenant: PROVINCE, sourceTenant: TENANT,
    collections: ['sp.mtop.mtops', 'sp.sanggunian.documents', 'sp.portal.projects'],
    purpose: 'Provincial oversight & transparency rollups (up_projection)',
    status: 'active',
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

  // ── Staff users ─────────────────────────────────────────────────────────────
  // Demo mode: every config.demoAccounts entry (shared demo password, is_demo).
  // Bootstrap mode: ONE superadmin from env (its own password, NOT a demo account)
  // and NO demo logins — for real production onboarding.
  type SeedUser = DemoUser & { password: string; isDemo: boolean };
  let seedUsers: SeedUser[];
  if (env.seedMode === 'bootstrap') {
    if (!env.bootstrapAdminEmail || !env.bootstrapAdminPassword) {
      throw new Error('SEED_MODE=bootstrap requires BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD');
    }
    const admin = ROLES.find((r) => r.roleKey === 'lgu_admin')!;
    seedUsers = [{
      username: env.bootstrapAdminEmail, name: 'System Administrator', role: 'lgu_admin',
      roleRef: admin.key, initials: 'AD', offices: admin.offices, memberships: admin.memberships,
      title: admin.title, password: env.bootstrapAdminPassword, isDemo: false,
    }];
  } else {
    seedUsers = USERS.map((u) => ({ ...u, password: PASSWORD, isDemo: true }));
  }
  for (const u of seedUsers) {
    const id = uuidv7();
    const roleId = roleIdByKey.get(u.roleRef) ?? null;
    const passwordHash = await argonHash(u.password);
    await db.insert(schema.users).values({
      id, tenantId: TENANT, username: u.username, name: u.name, role: u.role,
      title: u.title, offices: u.offices, initials: u.initials, passwordHash,
      roleId, isDemo: u.isDemo,
    }).onConflictDoNothing();
    // Resolve the actual user id (insert may have conflicted on a prior run) and
    // (re)link role + memberships idempotently.
    const rows = await sql<{ id: string }[]>`SELECT id FROM platform.users WHERE tenant_id = ${TENANT} AND username = ${u.username} LIMIT 1`;
    const uid = rows[0]?.id;
    if (uid) {
      await sql`UPDATE platform.users SET role_id = ${roleId}, is_demo = ${u.isDemo} WHERE id = ${uid}`;
      for (const m of u.memberships) {
        await db.insert(schema.memberships).values({ userId: uid, office: m.office, officeRole: m.officeRole }).onConflictDoNothing();
      }
    }
  }

  // ── Reference data ────────────────────────────────────────────────────────────
  const members = santaCruzConfig.modules.sanggunian.members ?? [];
  for (const m of members) await seedDoc(TENANT, 'sp.sanggunian.members', null, { ...m });

  for (const c of santaCruzConfig.modules.sanggunian.committees ?? []) {
    await seedDoc(TENANT, 'sp.sanggunian.bodies', null, { ...c });
  }

  const zones = santaCruzConfig.modules.mtop.zones ?? [];
  for (const z of zones) {
    const id = await seedDoc(TENANT, 'sp.mtop.zones', null, { ...z });
    await db.insert(schema.zoneCounters).values({ tenantId: TENANT, zoneId: id, used: z.used }).onConflictDoNothing();
  }

  for (const t of santaCruzConfig.modules.mtop.todas ?? []) await seedDoc(TENANT, 'sp.mtop.todas', null, { ...t });

  const fees = santaCruzConfig.modules.treasury.fees ?? [];
  for (const f of fees) await seedDoc(TENANT, 'sp.treasury.fees', null, { ...f });

  const projects = santaCruzConfig.modules.portal.projects ?? [];
  for (const p of projects) await seedDoc(TENANT, 'sp.portal.projects', null, { ...p });

  // ── Demo legislative documents + sessions (DEMO mode only) ────────────────────
  if (env.seedMode !== 'bootstrap') {
    for (const d of santaCruzConfig.modules.sanggunian.sampleDocuments ?? []) {
      const { wf, ...rest } = d;
      await seedDoc(TENANT, 'sp.sanggunian.documents', d.ref, { ...rest, ...(wf ? { wf: wfAt(wf.def, wf.current) } : {}) });
    }
    for (const s of santaCruzConfig.modules.sanggunian.sampleSessions ?? []) {
      await seedDoc(TENANT, 'sp.sanggunian.sessions', null, { ...s });
    }
  }

  if (env.seedMode === 'bootstrap') {
    console.log(`Bootstrap seed complete. Superadmin: ${env.bootstrapAdminEmail} (tenant ${TENANT}). No demo data.`);
  } else {
    const adminLogin = santaCruzConfig.demoAccounts?.find((a) => a.role === 'lgu_admin')?.email ?? 'admin';
    console.log(`Seed complete. Demo login: ${adminLogin} / demo1234 (tenant ${TENANT}).`);
  }
  await sql.end();
}

main().catch(async (e) => { console.error(e); await sql.end(); process.exit(1); });
