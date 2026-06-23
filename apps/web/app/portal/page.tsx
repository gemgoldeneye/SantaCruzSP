import { PortalHome } from '@/components/portal-home';
import type { Project, Ordinance } from '@/portal-api';

// Server-rendered at request time (not build) — the Fastify api need not be up at
// build, and the transparency data is always fresh.
export const dynamic = 'force-dynamic';

// Server-side fetch needs an ABSOLUTE url (the same-origin rewrite is browser-only).
// The /api/public/* endpoints are no-auth, so a direct call to the Fastify api works.
const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8787';

async function getPublicData(): Promise<{ projects: Project[]; ordinances: Ordinance[]; unreachable: boolean }> {
  try {
    const [p, o] = await Promise.all([
      fetch(`${API}/api/public/projects`, { cache: 'no-store' }).then((r) => r.json()),
      fetch(`${API}/api/public/ordinances`, { cache: 'no-store' }).then((r) => r.json()),
    ]);
    return { projects: (p.projects ?? []) as Project[], ordinances: (o.ordinances ?? []) as Ordinance[], unreachable: false };
  } catch {
    return { projects: [], ordinances: [], unreachable: true };
  }
}

export default async function PortalHomePage() {
  const { projects, ordinances, unreachable } = await getPublicData();
  return <PortalHome projects={projects} ordinances={ordinances} unreachable={unreachable} />;
}
