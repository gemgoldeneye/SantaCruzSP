'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { RolesManager, type RoleRow } from '@/components/admin/roles-manager';
import { adminFetch } from '@/api';

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await adminFetch('/api/admin/roles');
        if (!res.ok) throw new Error('Restricted');
        setRoles((await res.json()) as RoleRow[]);
      } catch (e) {
        setError(String((e as Error).message ?? e));
      }
    })();
  }, []);

  return (
    <>
      <PageHeader title="Roles" description="Define the roles a user account can hold and the access each role grants." />
      {error ? (
        <div className="rounded-xl border bg-card p-12 text-center text-sm text-muted-foreground">Restricted — {error}</div>
      ) : roles ? (
        <RolesManager initialRoles={roles} />
      ) : (
        <div className="text-sm text-muted-foreground">Loading…</div>
      )}
    </>
  );
}
