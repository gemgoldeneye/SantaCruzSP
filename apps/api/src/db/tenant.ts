// Request-scoped tenant transactions. Every data-path query runs inside one of
// these: SET LOCAL app.tenant_id makes the RLS policies bite for exactly the
// duration of the transaction. The API role (zsp_app) is not the table owner, so
// there is no bypass path. Single-tenant: tenantId is the one deployment tenant.
import { sql as rawSql } from 'drizzle-orm';
import { db } from './client.js';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type TenantTx = Tx;

export async function withTenant<T>(tenantId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(rawSql`SELECT set_config('app.tenant_id', ${tenantId}, true)`);
    return fn(tx);
  });
}

/**
 * Write-path variant: additionally takes the advisory lock BEFORE any insert,
 * serializing write transactions so change_log seq order === commit order
 * (gapless /sync/pull cursor). Fine at LGU scale.
 */
export async function withTenantWrite<T>(tenantId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(rawSql`SELECT set_config('app.tenant_id', ${tenantId}, true)`);
    await tx.execute(rawSql`SELECT pg_advisory_xact_lock(hashtext(${tenantId}))`);
    return fn(tx);
  });
}
