// Analytics read model — computed on-read from the live tables (data.documents).
// Materializing into a proj.* table is a later optimization, unnecessary at LGU
// scale. Staff-readable (any office viewer); the full breakdown is exec-only.
import type { FastifyInstance } from 'fastify';
import { sql as rawSql } from 'drizzle-orm';
import { withTenant } from '../db/tenant.js';
import { requireUser } from '../auth/guard.js';

export async function reportRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireUser);

  app.get('/api/reports/analytics', async () => {
    return withTenant(async (tx) => {
      const rows = <T,>(r: unknown) => r as unknown as T[];

      const docsByStage = rows<{ stage: string; count: number }>(await tx.execute(rawSql`
        SELECT COALESCE(doc->>'stage','(none)') AS stage, count(*)::int AS count
        FROM data.documents
        WHERE collection = 'sp.sanggunian.documents' AND deleted_at IS NULL
        GROUP BY 1 ORDER BY count DESC
      `));

      const mtopByStatus = rows<{ status: string; count: number }>(await tx.execute(rawSql`
        SELECT COALESCE(doc->>'status','unknown') AS status, count(*)::int AS count
        FROM data.documents
        WHERE collection = 'sp.mtop.mtops' AND deleted_at IS NULL
        GROUP BY 1 ORDER BY count DESC
      `));

      const appsByStage = rows<{ stage: string; count: number }>(await tx.execute(rawSql`
        SELECT COALESCE(doc#>>'{wf,current}','0') AS stage, count(*)::int AS count
        FROM data.documents
        WHERE collection = 'sp.mtop.applications' AND deleted_at IS NULL
        GROUP BY 1 ORDER BY 1
      `));

      const revenue = rows<{ total: number }>(await tx.execute(rawSql`
        SELECT COALESCE(SUM(total_amount) FILTER (WHERE status = 'paid'), 0)::int AS total
        FROM data.payment_orders
      `))[0] ?? { total: 0 };

      const totals = rows<{ documents: number; sessions: number; feedback: number }>(await tx.execute(rawSql`
        SELECT
          count(*) FILTER (WHERE collection = 'sp.sanggunian.documents')::int AS documents,
          count(*) FILTER (WHERE collection = 'sp.sanggunian.sessions')::int AS sessions,
          count(*) FILTER (WHERE collection = 'sp.portal.feedback')::int AS feedback
        FROM data.documents WHERE deleted_at IS NULL
      `))[0] ?? { documents: 0, sessions: 0, feedback: 0 };

      return { docsByStage, mtopByStatus, appsByStage, revenue: revenue.total, totals };
    });
  });
}
