'use client';

import { useEffect } from 'react';

/**
 * DEV-ONLY service-worker killer.
 *
 * A previous PRODUCTION build (Serwist) may have registered a service worker on
 * this origin. In development the app serves NO service worker, so that stale
 * worker lingers in the browser and can intercept `/api` + `/auth` requests —
 * which silently breaks login (the request never reaches the proxy/API). Since
 * dev never ships a fresh SW to replace it, it can't self-update away.
 *
 * On mount in development this unregisters any service worker + drops its caches,
 * and reloads once if one was actively controlling the page (so it stops
 * intercepting). It renders nothing and is gated out of production builds.
 */
export function DevSwKiller() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    const ONCE = '__sp_dev_sw_killed';
    navigator.serviceWorker.getRegistrations().then((regs) => {
      if (regs.length === 0 || sessionStorage.getItem(ONCE)) return;
      Promise.all(regs.map((r) => r.unregister()))
        .then(() =>
          typeof caches === 'undefined'
            ? undefined
            : caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))),
        )
        .then(() => {
          sessionStorage.setItem(ONCE, '1');
          // The unregistered worker still controls THIS page until a reload.
          if (navigator.serviceWorker.controller) window.location.reload();
        })
        .catch(() => {});
    });
  }, []);
  return null;
}
