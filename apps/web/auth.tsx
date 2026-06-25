'use client';

// Staff auth context — wraps the sync-client auth glue (server session + recorded
// actor). The recorded actor is what the server validates mutations against, so
// login here also attributes every queued offline mutation.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@gelabs/sp/contracts';
import { loginStaff, logoutStaff, restoreSession } from './store';

interface AuthCtx {
  user: User | null;
  ready: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void restoreSession().then((res) => {
      if (res) setUser(res.user);
      setReady(true);
    });
  }, []);

  const value: AuthCtx = {
    user, ready,
    login: async (username, password) => {
      const res = await loginStaff(username, password);
      setUser(res.user);
    },
    logout: async () => {
      await logoutStaff();
      setUser(null);
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be used within AuthProvider');
  return c;
}
