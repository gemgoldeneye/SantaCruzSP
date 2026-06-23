'use client';

// Citizen OTP auth context. On verify, sets the sync-client actor (so queued
// feedback mutations are attributed to this citizen and the server accepts them).
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { setActor, clearActor } from './store';
import { api, type CitizenAccount } from './portal-api';

interface CitizenCtx {
  account: CitizenAccount | null;
  ready: boolean;
  requestOtp: (mobile: string) => Promise<string | undefined>;
  verify: (mobile: string, code: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<CitizenCtx | null>(null);
const deviceId = () => localStorage.getItem('sp.deviceId') ?? 'web';

export function CitizenProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<CitizenAccount | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void api.me()
      .then(async (r) => { setAccount(r.account); await setActor(r.account.id, r.account.name, deviceId()); })
      .catch(() => { /* not signed in */ })
      .finally(() => setReady(true));
  }, []);

  const value: CitizenCtx = {
    account, ready,
    requestOtp: async (mobile) => (await api.otpRequest(mobile)).devCode,
    verify: async (mobile, code, name) => {
      const r = await api.otpVerify(mobile, code, name);
      setAccount(r.account);
      await setActor(r.account.id, r.account.name, deviceId());
    },
    logout: async () => { await api.logout().catch(() => {}); await clearActor(); setAccount(null); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCitizen(): CitizenCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useCitizen outside provider');
  return c;
}
