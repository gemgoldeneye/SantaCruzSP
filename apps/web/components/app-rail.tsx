'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { canAccessOffice, isExecutive, type User } from '@gelabs/sp/contracts';
import { getOffice } from '@gelabs/sp/modules';
import { useSpConfig } from '@gelabs/sp/ui/client';
import { NAV_ITEMS } from '@/lib/navigation';
import { cn } from '@/lib/utils';

const GATE: Record<string, { office?: string; exec?: boolean }> = {
  '/scan': { office: 'sanggunian' },
  '/sessions': { office: 'sanggunian' },
  '/tracking': { office: 'sanggunian' },
  '/prangkisa': { office: 'mtop' },
  '/accounts': { exec: true },
  '/roles': { exec: true },
  '/logs': { exec: true },
};

function allowed(user: User, href: string): boolean {
  const g = GATE[href];
  if (!g) return true;
  if (g.exec) return isExecutive(user);
  if (g.office) { const o = getOffice(g.office); return o ? canAccessOffice(user, o) : true; }
  return true;
}

export function AppRail({ user }: { user: User }) {
  const pathname = usePathname() ?? '/';
  const cfg = useSpConfig();
  const seal = cfg.municipality.sealSrc;
  const brand = `${cfg.municipality.shortName} Sanggunian`;
  const items = NAV_ITEMS.filter((item) => !item.hidden && allowed(user, item.href));

  return (
    <aside className="sticky top-0 flex h-svh w-16 shrink-0 flex-col items-center gap-2 bg-[var(--sp-sidebar)] py-4 sm:w-20">
      <Link
        href="/"
        title={brand}
        className="flex size-10 items-center justify-center rounded-xl bg-white p-1 shadow-sm"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- config-driven seal asset, not a build-time import */}
        <img src={seal} alt={brand} width={34} height={34} />
      </Link>

      <nav className="flex w-full flex-1 flex-col items-stretch gap-1 px-1.5 pt-2">
        {items.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.title}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl py-2.5 text-center text-[10px] leading-none font-medium transition-colors',
                active ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white',
              )}
            >
              <Icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
