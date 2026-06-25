// Notifications — a CURATED feed of the important things that happened in the
// apps (a new scanned/filed document, a session created, a franchise application
// filed, an MTOP issued, citizen feedback). This is deliberately a subset of the
// full audit trail (platform.audit_events): Activity Logs (/api/admin/audit, exec
// only) shows EVERYTHING incl. logins; Notifications shows the headline events and
// is readable by any signed-in staff. Rows are enriched with the record's
// title/ref so the feed reads as sentences, not ids.
import type { FastifyInstance } from 'fastify';
import { sql as rawSql } from 'drizzle-orm';
import { withTenant } from '../db/tenant.js';
import { requireUser } from '../auth/guard.js';

export async function notificationRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireUser);

  app.get('/api/notifications', async (req) => {
    const q = req.query as { limit?: string };
    const limit = Math.min(Math.max(Number(q.limit ?? 40) || 40, 1), 200);
    return withTenant(async (tx) => {
      const rows = await tx.execute(rawSql`
        SELECT a.seq, a.at, a.actor_name AS "actorName", a.actor_role AS "actorRole",
               a.action, a.collection, a.doc_id AS "docId",
               d.doc->>'title' AS "title", d.doc->>'ref' AS "ref",
               d.doc->>'applicantName' AS "applicantName"
        FROM platform.audit_events a
        LEFT JOIN data.documents d
          ON d.collection = a.collection AND d.id = a.doc_id
        WHERE a.action = 'create'
          AND a.collection IN (
            'sp.sanggunian.documents',
            'sp.sanggunian.sessions',
            'sp.mtop.applications',
            'sp.mtop.mtops',
            'sp.portal.feedback'
          )
          AND d.deleted_at IS NULL   -- don't notify about records that were since deleted
        ORDER BY a.seq DESC
        LIMIT ${limit}
      `);
      return rows as unknown;
    });
  });
}
