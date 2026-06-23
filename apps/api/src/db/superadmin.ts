// Reconcile the SINGLE bootstrap superadmin from SUPERADMIN_* env on every API boot.
//
// Why this exists: the LGU's one admin login is defined ONLY by apps/api/.env
// (SUPERADMIN_EMAIL + SUPERADMIN_PASSWORD). The original `db:seed` was create-only
// (onConflictDoNothing), so changing the env email created a DUPLICATE admin and
// changing the password did nothing. This makes .env the single source of truth:
// change either value, restart the API, and the SAME one superadmin row is renamed
// and/or re-hashed — never duplicated, never stale.
//
// Identity is pinned to a fixed UUID so an email change updates THAT SAME row instead
// of accumulating orphans. Runs as the OWNER role (bypasses RLS), like the seed.
import postgres from 'postgres';
import { hash as argonHash } from '@node-rs/argon2';
import { env } from '../env.js';

// Stable, deterministic id for the env-defined superadmin. Its all-zero prefix never
// collides with the time-ordered uuidv7 ids minted for real users.
const SUPERADMIN_ID = '00000000-0000-7000-8000-000000000001';
const ADMIN_TITLE = { fil: 'Administrador', en: 'Administrator' };

/**
 * Ensure exactly one superadmin exists matching SUPERADMIN_EMAIL/SUPERADMIN_PASSWORD.
 * Idempotent and safe to run on every boot. No-op when the env vars are unset.
 */
export async function reconcileSuperadmin(): Promise<void> {
  const email = env.superAdminEmail;
  const password = env.superAdminPassword;
  if (!email || !password) return; // nothing declared → leave existing accounts alone

  const sql = postgres(env.ownerDatabaseUrl, { max: 1 });
  try {
    const tenant = env.defaultTenant;
    const passwordHash = await argonHash(password);
    const roleRows = await sql<{ id: string }[]>`
      SELECT id FROM platform.roles WHERE tenant_id = ${tenant} AND key = 'ADMIN' LIMIT 1`;
    const roleId = roleRows[0]?.id ?? null;

    await sql.begin(async (tx) => {
      // First boot under this scheme: adopt a pre-existing SOLE bootstrap admin (left by
      // the old create-only seed) into the canonical slot — only when unambiguous, so we
      // never clobber admins the LGU created in-app.
      const canon = await tx`SELECT 1 FROM platform.users WHERE id = ${SUPERADMIN_ID}`;
      if (canon.length === 0) {
        const admins = await tx<{ id: string }[]>`
          SELECT id FROM platform.users
          WHERE tenant_id = ${tenant} AND role = 'lgu_admin' AND is_demo = false`;
        if (admins.length === 1) {
          await tx`UPDATE platform.users SET id = ${SUPERADMIN_ID} WHERE id = ${admins[0]!.id}`;
        }
      }
      // env is authoritative: drop any other row squatting the target username, then upsert
      // the canonical row (rename on email change, re-hash on password change).
      await tx`DELETE FROM platform.users
               WHERE tenant_id = ${tenant} AND username = ${email} AND id <> ${SUPERADMIN_ID}`;
      await tx`
        INSERT INTO platform.users
          (id, tenant_id, username, name, role, title, offices, initials, password_hash, role_id, is_demo)
        VALUES
          (${SUPERADMIN_ID}, ${tenant}, ${email}, 'System Administrator', 'lgu_admin',
           ${JSON.stringify(ADMIN_TITLE)}::jsonb, ${'{*}'}::text[], 'AD', ${passwordHash}, ${roleId}, false)
        ON CONFLICT (id) DO UPDATE SET
          username      = EXCLUDED.username,
          password_hash = EXCLUDED.password_hash,
          role          = 'lgu_admin',
          role_id       = COALESCE(EXCLUDED.role_id, platform.users.role_id),
          is_demo       = false`;
    });
  } finally {
    await sql.end();
  }
}
