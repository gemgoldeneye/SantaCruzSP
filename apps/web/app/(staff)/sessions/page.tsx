'use client';

import { hasPermission } from '@gelabs/sp/contracts';
import { SessionDashboard } from '@/components/session-dashboard';
import { useLegacyDocuments, useLegacySessions } from '@/hooks/data';
import { useAuth } from '@/auth';

export default function SessionsPage() {
  const { user } = useAuth();
  // CRUD is gated on the explicit 'sessions:manage' grant (executives bypass) —
  // enforced identically on the server.
  const canManage = user ? hasPermission(user, 'sessions:manage') : false;
  return (
    <SessionDashboard
      sessions={useLegacySessions()}
      documents={useLegacyDocuments()}
      canManage={canManage}
    />
  );
}
