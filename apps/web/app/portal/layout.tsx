'use client';

import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { bootSync } from '@gelabs/sp/sync-client';
import { useSpConfig, useCopy } from '@gelabs/sp/ui/client';
import { LangProvider, useLang } from '@/i18n';
import { CitizenProvider } from '@/citizenAuth';
import { cn } from '@/lib/utils';

function PortalChrome({ children }: { children: ReactNode }) {
  const { t, toggle, lang } = useLang();
  const cfg = useSpConfig();
  const copy = useCopy();
  const pathname = usePathname() ?? '/';
  const navClass = (active: boolean) =>
    cn(
      'rounded-md px-2 py-1 text-sm font-medium transition-colors hover:text-foreground',
      active ? 'text-foreground' : 'text-muted-foreground',
    );

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-2 px-4">
          <Link href="/portal" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- config-driven seal asset */}
            <img
              src={cfg.municipality.sealSrc}
              alt={`Seal of the ${cfg.municipality.fullName}`}
              width={36}
              height={36}
              className="rounded-sm"
            />
            <div className="leading-tight">
              <div className="font-heading text-sm font-semibold">
                {copy('portalHeader', lang, `${cfg.municipality.shortName} Sanggunian Portal`)}
              </div>
              <div className="text-xs text-muted-foreground">
                Sangguniang Bayan ng {cfg.municipality.shortName}
              </div>
            </div>
          </Link>
          <nav className="flex items-center gap-0.5 sm:gap-1">
            <Link href="/portal" className={navClass(pathname === '/portal')}>{t('Bahay', 'Home')}</Link>
            <Link href="/portal/verify" className={navClass(pathname.startsWith('/portal/verify'))}>{t('Tsek', 'Verify')}</Link>
            <Link href="/portal/feedback" className={navClass(pathname.startsWith('/portal/feedback'))}>{t('Feedback', 'Feedback')}</Link>
            <Link href="/portal/account" className={navClass(pathname.startsWith('/portal/account'))}>{t('Akawnt', 'Account')}</Link>
            <button
              onClick={toggle}
              aria-label="Toggle language"
              className="ml-1 inline-flex h-8 items-center rounded-lg border px-2.5 text-xs font-medium transition-colors hover:bg-accent"
            >
              {lang === 'fil' ? 'EN' : 'FIL'}
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        {copy('portalFooter', lang, cfg.municipality.fullName)}
      </footer>
    </div>
  );
}

export default function PublicLayout({ children }: { children: ReactNode }) {
  // Boot the offline sync layer (fire-and-forget) so the citizen feedback flow has
  // its Dexie store + the CitizenProvider can set the recorded actor. Home/Verify
  // don't need it, so no blocking gate — the portal renders immediately.
  useEffect(() => {
    void bootSync({ apiBase: '', appKey: 'sp' });
  }, []);

  return (
    <LangProvider>
      <CitizenProvider>
        <PortalChrome>{children}</PortalChrome>
      </CitizenProvider>
    </LangProvider>
  );
}
