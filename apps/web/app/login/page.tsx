"use client";

import { useState } from "react";
import { useSpConfig, useCopy } from "@gelabs/sp/ui/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { loginStaff } from "@/store";

export default function Login() {
  const router = useRouter();
  const cfg = useSpConfig();
  const copy = useCopy();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(loginEmail: string, loginPassword: string) {
    setPending(true);
    setError(null);
    try {
      await loginStaff(loginEmail, loginPassword);
      // Session cookie is set; go to the staff shell — its layout restoreSession()s.
      router.replace("/");
    } catch {
      setError("Sign-in failed. Please check your credentials.");
      setPending(false);
    }
  }

  const inputClass = "w-full rounded-lg border border-border/70 bg-white/80 px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:bg-white";

  return (
    <div className="flex min-h-svh items-center justify-center bg-[var(--sp-header)] p-4">
      <Card className="w-full max-w-md border-white/60 bg-white/85 text-foreground shadow-2xl backdrop-blur-md">
        <CardHeader className="text-center">
          <img src={cfg.municipality.sealSrc} alt={`Official seal of the ${cfg.municipality.fullName}`} width={88} height={88} className="mx-auto drop-shadow-sm" />
          <div className="mt-2 font-heading text-xl font-bold tracking-tight text-primary">{copy("councilName", cfg.defaultLang, cfg.municipality.fullName)}</div>
          <div className="text-xs text-muted-foreground">{copy("staffLoginSubtitle", cfg.defaultLang)}</div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); if (!pending) login(email, password); }}>
            <input type="email" required autoComplete="username" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            <input type="password" required autoComplete="current-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
            <Button type="submit" disabled={pending} className="w-full">{pending ? "Signing in…" : "Sign in"}</Button>
          </form>

          {error && <p className="text-center text-sm font-medium text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
