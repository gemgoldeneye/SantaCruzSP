'use client';

import { useMemo, useState } from 'react';
import { Building2, FileCheck2, MapPin, Search } from 'lucide-react';
import { useLang } from '@/i18n';
import type { Project, Ordinance } from '@/portal-api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const peso = (n: number) => `₱${n.toLocaleString('en-PH')}`;

const PROJECT_STATUS: Record<string, 'default' | 'secondary' | 'outline'> = {
  Completed: 'default',
  Ongoing: 'secondary',
  Planned: 'outline',
};

/**
 * Portal Home — a client island. The transparency data (ordinances + projects) is
 * server-fetched in app/(public)/page.tsx and passed in as props, so it is in the
 * initial server-rendered HTML (SEO); the search + bilingual toggle are interactive.
 */
export function PortalHome({
  projects,
  ordinances,
  unreachable = false,
}: {
  projects: Project[];
  ordinances: Ordinance[];
  unreachable?: boolean;
}) {
  const { t } = useLang();
  const [query, setQuery] = useState('');

  const approved = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ordinances.filter(
      (o) => !q || [o.ref, o.title, o.summary, o.type].join(' ').toLowerCase().includes(q),
    );
  }, [ordinances, query]);

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border bg-primary/5 px-6 py-10 text-center">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {t('Portal ng Transparency ng Batas — Santa Cruz', 'Santa Cruz Legislative Transparency Portal')}
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
          {t(
            'Tingnan ang mga naisabatas na ordinansa at resolusyon, subaybayan ang mga proyekto ng bayan, at magpadala ng puna sa Sangguniang Bayan ng Santa Cruz.',
            'Access approved municipal ordinances and resolutions, track public projects, and share your feedback with the Sangguniang Bayan ng Santa Cruz.',
          )}
        </p>
        <div className="relative mx-auto mt-6 max-w-xl">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Maghanap ng ordinansa o resolusyon…', 'Search approved ordinances and resolutions…')}
            className="h-11 pl-9"
            aria-label="Search public records"
          />
        </div>
      </section>

      {unreachable && (
        <p className="text-center text-sm text-muted-foreground">
          {t('Offline o hindi maabot ang server.', 'Offline or server unreachable.')}
        </p>
      )}

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <FileCheck2 className="size-5 text-primary" />
          <h2 className="font-heading text-xl font-semibold">
            {t('Mga naisabatas na hakbang', 'Approved & enacted measures')}
          </h2>
          <Badge variant="secondary">{approved.length}</Badge>
        </div>
        {approved.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {unreachable
              ? t('Walang maipakita habang offline.', 'No records to show while offline.')
              : t('Walang tumugmang pampublikong rekord.', 'No public records match your search.')}
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {approved.map((o) => (
              <Card key={o.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{o.ref}</span>
                    <Badge variant="outline">{o.type}</Badge>
                  </div>
                  <CardTitle className="text-base leading-snug">{o.title}</CardTitle>
                  <CardDescription>{o.year}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{o.summary}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="size-5 text-primary" />
          <h2 className="font-heading text-xl font-semibold">
            {t('Mga proyekto ng bayan', 'Municipal projects')}
          </h2>
        </div>
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">{unreachable ? '' : t('Wala pa.', 'None yet.')}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((p) => (
              <Card key={p.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{p.name}</CardTitle>
                    <Badge variant={PROJECT_STATUS[p.status] ?? 'outline'}>{p.status}</Badge>
                  </div>
                  <CardDescription className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" /> {p.municipality} · {peso(p.budget)}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
