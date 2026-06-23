// Request-scoped tenant transactions. Every data-path query runs inside one of
// these: SET LOCAL app.tenant_id makes the RLS policies bite for exactly the
// duration of the transaction. The API role (zsp_app) is not the table owner, so
// there is no bypass path.
import { and, eq, sql as rawSql } from 'drizzle-orm';
import { db } from './client.js';
import { dataGrants, tenants } from '@gelabs/sp/data';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type TenantTx = Tx;

export async function withTenant<T>(tenantId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(rawSql`SELECT set_config('app.tenant_id', ${tenantId}, true)`);
    return fn(tx);
  });
}

/**
 * Write-path variant: additionally takes the per-tenant advisory lock BEFORE any
 * insert, serializing write transactions per tenant so change_log seq order ===
 * commit order (gapless /sync/pull cursor). Fine at LGU scale.
 */
export async function withTenantWrite<T>(tenantId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(rawSql`SELECT set_config('app.tenant_id', ${tenantId}, true)`);
    await tx.execute(rawSql`SELECT pg_advisory_xact_lock(hashtext(${tenantId}))`);
    return fn(tx);
  });
}

/**
 * Cross-tenant READ, gated by a Data Sharing Agreement (platform.data_grants).
 * The ONLY way one tenant's code reads another tenant's data: verify an active
 * grant, then run `fn` scoped to the SOURCE tenant. Returns null if no grant.
 */
export async function readGranted<T>(
  granteeTenant: string, sourceTenant: string, collection: string,
  fn: (tx: Tx) => Promise<T>,
): Promise<T | null> {
  const grant = await db.select().from(dataGrants).where(and(
    eq(dataGrants.granteeTenant, granteeTenant),
    eq(dataGrants.sourceTenant, sourceTenant),
    eq(dataGrants.status, 'active'),
  )).limit(1);
  if (!grant[0] || !grant[0].collections.includes(collection)) return null;
  return db.transaction(async (tx) => {
    await tx.execute(rawSql`SELECT set_config('app.tenant_id', ${sourceTenant}, true)`);
    return fn(tx);
  });
}

/**
 * Read a collection across ALL child (municipality) tenants of the province hub —
 * the provincial rollup path. A collection the province was NOT granted simply
 * contributes nothing.
 */
export async function readChildren<T>(
  parentTenant: string, collection: string, fn: (tx: Tx) => Promise<T>,
): Promise<Array<{ tenant: string; rows: T }>> {
  const children = await db.select({ id: tenants.id }).from(tenants).where(
    eq(tenants.parentTenantId, parentTenant),
  );
  const out: Array<{ tenant: string; rows: T }> = [];
  for (const c of children) {
    const rows = await readGranted<T>(parentTenant, c.id, collection, fn);
    if (rows !== null) out.push({ tenant: c.id, rows });
  }
  return out;
}
