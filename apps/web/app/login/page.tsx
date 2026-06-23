"use client";

import { useState } from "react";
import { ShieldCheck, UserRound } from "lucide-react";
import { useSpConfig, useCopy } from "@gelabs/sp/ui/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { loginStaff } from "@/store";

type Group = "presiding" | "council" | "staff";
interface DemoAccount { email: string; name: string; roleLabel: string; group: Group; password: string }

/** Platform RBAC roles → login display. Roles are SP-wide (not per-municipality); the
 *  accounts themselves come from the active LGU config (`config.demoAccounts`). */
const ROLE_DISPLAY: Record<string, { roleLabel: string; group: Group }> = {
  presiding_officer: { roleLabel: "Presiding Officer", group: "presiding" },
  lgu_admin: { roleLabel: "Administrator", group: "presiding" },
  member: { roleLabel: "Councilor", group: "council" },
  secretariat: { roleLabel: "Secretariat", group: "staff" },
  operator: { roleLabel: "MTOP Clerk", group: "staff" },
};

export default function Login() {
  const router = useRouter();
  const cfg = useSpConfig();
  const copy = useCopy();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demoAccounts: DemoAccount[] = (cfg.demoAccounts ?? []).map((a) => {
    const display = ROLE_DISPLAY[a.role] ?? { roleLabel: a.role, group: "staff" as Group };
    return { email: a.email, name: a.name, password: a.password ?? "demo1234", ...display };
  });
  const demoPassword = cfg.demoAccounts?.[0]?.password ?? "demo1234";

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

  const presiding = demoAccounts.filter((a) => a.group === "presiding");
  const council = demoAccounts.filter((a) => a.group === "council");
  const staff = demoAccounts.filter((a) => a.group === "staff");

  const AccountButton = ({ a }: { a: DemoAccount }) => (
    <button
      type="button"
      disabled={pending}
      onClick={() => login(a.email, a.password)}
      className="flex w-full items-center gap-3 rounded-lg border border-border/70 bg-white/70 p-3 text-left transition-colors hover:border-primary hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        {a.group === "presiding" ? <ShieldCheck className="size-5" /> : <UserRound className="size-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{a.name}</div>
        <div className="truncate text-xs text-muted-foreground">{a.roleLabel}</div>
      </div>
    </button>
  );

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

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />quick demo sign-in<span className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Presiding officer<Badge className="ml-auto">Full access</Badge></div>
            {presiding.map((a) => <AccountButton key={a.email} a={a} />)}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Councilors (Sangguniang Bayan)<Badge variant="secondary" className="ml-auto">Member access</Badge></div>
            {council.map((a) => <AccountButton key={a.email} a={a} />)}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Secretariat<Badge variant="secondary" className="ml-auto">Records staff</Badge></div>
            {staff.map((a) => <AccountButton key={a.email} a={a} />)}
          </div>

          <p className="text-center text-xs text-muted-foreground">Demo password: <code className="font-mono">{demoPassword}</code></p>
        </CardContent>
      </Card>
    </div>
  );
}
