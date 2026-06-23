'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { AccountsManager, type AccountRow, type RoleOption } from '@/components/admin/accounts-manager';
import { adminFetch } from '@/api';

export default function AccountsPage() {
  const [data, setData] = useState<{ accounts: AccountRow[]; roles: RoleOption[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [accRes, roleRes] = await Promise.all([adminFetch('/api/admin/accounts'), adminFetch('/api/admin/roles')]);
        if (!accRes.ok) throw new Error('Restricted');
        const accounts = (await accRes.json()) as AccountRow[];
        const roles = roleRes.ok ? ((await roleRes.json()) as { id: string; name: string; roleKey: string }[]).map((r) => ({ id: r.id, name: r.name, roleKey: r.roleKey })) : [];
        setData({ accounts, roles });
      } catch (e) {
        setError(String((e as Error).message ?? e));
      }
    })();
  }, []);

  return (
    <>
      <PageHeader title="Accounts" description="Manage user accounts — create, edit, and remove sign-in credentials and assign each account a role." />
      {error ? (
        <div className="rounded-xl border bg-card p-12 text-center text-sm text-muted-foreground">Restricted — {error}</div>
      ) : data ? (
        <AccountsManager initialAccounts={data.accounts} initialRoles={data.roles} />
      ) : (
        <div className="text-sm text-muted-foreground">Loading…</div>
      )}
    </>
  );
}
