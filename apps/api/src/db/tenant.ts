// Request-scoped data transactions. Single-LGU per database — there is no tenant
// concept and no RLS isolation, so these are thin transaction wrappers kept under
// the historical names to minimize call-site churn.
import { sql as rawSql } from 'drizzle-orm';
import { db } from './client.js';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type TenantTx = Tx;

export async function withTenant<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => fn(tx));
}

/**
 * Write-path variant: additionally takes a FIXED advisory lock BEFORE any insert,
 * serializing write transactions so change_log seq order === commit order
 * (gapless /sync/pull cursor). Fine at LGU scale (one DB = one municipality).
 */
export async function withTenantWrite<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(rawSql`SELECT pg_advisory_xact_lock(1)`);
    return fn(tx);
  });
}
