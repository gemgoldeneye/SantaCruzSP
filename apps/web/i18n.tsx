'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Lang } from '@gelabs/sp/contracts';

interface LangCtx { lang: Lang; toggle: () => void; t: (fil: string, en: string) => string; }
const Ctx = createContext<LangCtx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  // SSR-safe: start at the default ('en') so the server render and the first client
  // render match (no hydration mismatch); apply the saved language after hydration.
  const [lang, setLang] = useState<Lang>('en');
  useEffect(() => {
    const saved = (typeof localStorage !== 'undefined' ? localStorage.getItem('sp.lang') : null) as Lang | null;
    if (saved && saved !== lang) setLang(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const set = (l: Lang) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem('sp.lang', l);
    setLang(l);
  };
  const value: LangCtx = { lang, toggle: () => set(lang === 'fil' ? 'en' : 'fil'), t: (fil, en) => (lang === 'fil' ? fil : en) };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useLang(): LangCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useLang outside provider');
  return c;
}
