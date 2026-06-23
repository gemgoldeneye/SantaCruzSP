'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { KeyRound, LogOut, Search } from 'lucide-react';
import type { User } from '@gelabs/sp/contracts';
import { SyncPill } from '@gelabs/sp/sync-client/ui';
import { useSpConfig } from '@gelabs/sp/ui/client';
import { activeNavItem } from '@/lib/navigation';
import { NotificationsBell } from '@/components/notifications-bell';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/auth';
import { ChangePasswordDialog } from '@/components/change-password-dialog';

export function AppTopbar({ user }: { user: User }) {
  const pathname = usePathname() ?? '/';
  const { logout } = useAuth();
  const cfg = useSpConfig();
  const title = pathname.startsWith('/documents') ? 'Document' : activeNavItem(pathname).title;
  const roleName = user.title?.en || user.role;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const signOut = async () => {
    setPending(true);
    try { await logout(); } catch { setPending(false); }
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 bg-[var(--sp-header)] px-4 text-white sm:px-6">
      <h1 className="min-w-0 truncate font-heading text-lg font-semibold sm:text-2xl">{title}</h1>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {/* Auto-sync status only — background loop pushes/pulls automatically; no manual review. */}
        <div className="hidden sm:block"><SyncPill lang="en" compact /></div>
        <Link
          href="/search"
          title="Search the e-library"
          className="hidden rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white sm:block"
        >
          <Search className="size-4" />
        </Link>
        <NotificationsBell />
        <div className="ml-1 hidden text-right leading-tight sm:block">
          <div className="text-sm font-medium">{user.name}</div>
          <div className="text-xs text-white/60">{roleName}</div>
        </div>
        <div className="flex size-9 items-center justify-center rounded-full bg-white/15 text-sm font-semibold">
          {user.initials || user.name.slice(0, 2).toUpperCase()}
        </div>
        <button
          type="button"
          onClick={() => setPwOpen(true)}
          title="Change password"
          className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <KeyRound className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          title="Sign out"
          className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="size-4" />
        </button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="dark">
          <DialogHeader>
            <DialogTitle>Sign out?</DialogTitle>
            <DialogDescription>
              You&apos;ll be signed out of the {cfg.municipality.shortName} Sanggunian e-archive and returned to the login screen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={pending} />}>Cancel</DialogClose>
            <Button variant="destructive" onClick={signOut} disabled={pending}>
              <LogOut className="size-4" />
              {pending ? 'Signing out…' : 'Sign out'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ChangePasswordDialog open={pwOpen} onOpenChange={setPwOpen} />
    </header>
  );
}
