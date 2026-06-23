'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { bootSync } from '@gelabs/sp/sync-client';
import { AuthProvider, useAuth } from '@/auth';
import { AppRail } from '@/components/app-rail';
import { AppTopbar } from '@/components/app-topbar';
import { Toaster } from '@/components/ui/sonner';

function LoadingScreen() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-[var(--sp-header)] text-sm font-medium text-white/70">
      Opening the app…
    </div>
  );
}

/** Auth gate + the navy shell (rail + topbar + dark content area). Mirrors the
 *  Vite Shell.tsx; renders nothing until the session is restored, then either the
 *  shell (authed) or a redirect to /login. */
function StaffShell({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace('/login');
  }, [ready, user, router]);

  if (!ready || !user) return <LoadingScreen />;

  return (
    <div className="flex min-h-svh bg-[var(--sp-header)]">
      <AppRail user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar user={user} />
        <main className="dark flex flex-1 flex-col gap-5 rounded-tl-[1.75rem] bg-background p-4 text-foreground md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * Offline-first boot gate (progressive — mirrors gelabs-ovr's admin layout). The
 * Vite app awaited bootSync() in main.tsx before the first paint; here the same
 * one async gate runs in a useEffect (IndexedDB/Dexie is browser-only, so it must
 * never run during SSR), and the shell unlocks once the local data layer is ready.
 */
export default function StaffLayout({ children }: { children: ReactNode }) {
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    let active = true;
    void bootSync({ apiBase: '', appKey: 'sp' }).then(() => {
      if (active) setBooted(true);
    });
    return () => { active = false; };
  }, []);

  if (!booted) return <LoadingScreen />;

  return (
    <AuthProvider>
      <StaffShell>{children}</StaffShell>
      <Toaster position="top-center" richColors />
    </AuthProvider>
  );
}
