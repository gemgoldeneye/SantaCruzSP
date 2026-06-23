import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { Geist, Geist_Mono } from 'next/font/google';
import { santaCruzConfig } from '@lgu/santacruz';
import './globals.css';
import { Providers } from './providers';
import { DevSwKiller } from '@/components/dev-sw-killer';

// Self-hosted Geist via next/font, bound to the design-system token names the
// theme reads (--font-sans / --font-mono).
const geistSans = Geist({ variable: '--font-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-mono', subsets: ['latin'] });

// The active per-LGU config (Santa Cruz). Read on the server; everything municipality-
// specific (identity, theme, copy) flows from here — no hardcoded strings.
const cfg = santaCruzConfig;

export const metadata: Metadata = {
  title: { default: cfg.municipality.fullName, template: `%s · ${cfg.municipality.shortName} Sanggunian` },
  description: cfg.apps.staff.description,
};

// Server-inline the per-LGU chrome theme vars on <html> (no client effect, no
// flash) — the same --sp-* tokens the Vite apps set via applyThemeVars().
const themeVars = {
  '--sp-header': cfg.theme.headerBg,
  '--sp-sidebar': cfg.theme.sidebarBg,
  '--sp-accent': cfg.theme.accent,
} as CSSProperties;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={themeVars}
    >
      <body className="min-h-full flex flex-col">
        {/* DEV-ONLY: kill any stale service worker left by a prior prod build,
            which would otherwise intercept /api + /auth and break login. */}
        {process.env.NODE_ENV !== 'production' && <DevSwKiller />}
        <Providers config={cfg}>{children}</Providers>
      </body>
    </html>
  );
}
