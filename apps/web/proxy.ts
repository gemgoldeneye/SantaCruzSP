/**
 * Proxy (Next.js 16's renamed Middleware). Optimistic auth redirects only — it
 * checks PRESENCE of the Fastify session cookie (set via the same-origin /auth
 * proxy); it does NOT verify the signature (@sp/api owns that secret, not the
 * edge). The authoritative check is the (staff) layout's restoreSession().
 */
import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'sp_sess';
/** Paths reachable without a staff session: the staff login + the public citizen portal. */
const PUBLIC_PATHS = ['/login', '/portal'];

const isPublic = (pathname: string) =>
  PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/** Serwist PWA assets — never auth-gated (they carry no session). */
const isPwaAsset = (pathname: string) =>
  pathname === '/sw.js' || pathname === '/manifest.webmanifest' || pathname.startsWith('/swe-worker-');

/**
 * A self-destroying service worker. DEV ships no SW, so a stale one left by a
 * prior PROD build lingers and intercepts /api + /auth (silently breaking login),
 * and it can't self-update because /sw.js used to redirect to /login. Serving this
 * at /sw.js makes the stale worker, on its next update check, unregister itself,
 * drop its caches, and reload open tabs — healing the browser with no manual step.
 */
const SELF_DESTROY_SW = `self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',(e)=>e.waitUntil((async()=>{
  try{await self.registration.unregister();}catch{}
  try{const ks=await caches.keys();await Promise.all(ks.map((k)=>caches.delete(k)));}catch{}
  for(const c of await self.clients.matchAll({type:'window'})){try{c.navigate(c.url);}catch{}}
})()));`;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);

  // PWA assets are never auth-redirected. In dev, serve a self-destroying service
  // worker so a stale SW from a prior prod build unregisters itself; in prod, let
  // the real (static) Serwist files serve untouched.
  if (isPwaAsset(pathname)) {
    if (process.env.NODE_ENV !== 'production' && pathname === '/sw.js') {
      return new NextResponse(SELF_DESTROY_SW, {
        headers: { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store' },
      });
    }
    return NextResponse.next();
  }

  // Signed-in staff shouldn't sit on the login page.
  if (pathname === '/login' && hasSession) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  // Everything that isn't public requires an (optimistically present) session.
  if (!isPublic(pathname) && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Skip the api/auth proxy paths, Next internals, and static assets.
  matcher: ['/((?!api|auth|healthz|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
