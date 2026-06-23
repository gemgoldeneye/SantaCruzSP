'use client';

// Initialize the offline-sync config (apiBase + deviceId) on EVERY client page —
// the staff console, /login, and the portal — BEFORE anything calls loginStaff()
// or touches the data layer. /login does NOT import data.ts (where the staff shell
// initializes it), so without this a cold sign-in would throw "initSyncClient()
// must run before any data access" inside getConfig() and fail before the request.
import '@/syncConfig';

import type { ReactNode } from 'react';
import type { SpConfig } from '@gelabs/sp/config';
import { SpConfigProvider } from '@gelabs/sp/ui/client';

/**
 * Client provider boundary. The per-LGU config is read on the server (root
 * layout) and passed across as plain JSON; this client component re-exposes it
 * via the SpConfigProvider context so `useSpConfig()`/`useCopy()` work app-wide.
 * (The offline-first BootProvider + the staff TooltipProvider/Toaster join in
 * later PRs, scoped to the route groups that need them.)
 */
export function Providers({ config, children }: { config: SpConfig; children: ReactNode }) {
  return <SpConfigProvider config={config}>{children}</SpConfigProvider>;
}
