"use client";

import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, UserRound } from "lucide-react";

import { AUTH_COOKIE, DEMO_ACCOUNTS, type DemoAccount } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function LoginPanel() {
  const signIn = (id: string) => {
    document.cookie = `${AUTH_COOKIE}=${id}; path=/; max-age=86400; SameSite=Lax`;
    // Full navigation so the server re-reads the cookie and renders the dashboard
    // (a client router.push can replay the cached signed-out → /login redirect).
    window.location.href = "/";
  };

  const presiding = DEMO_ACCOUNTS.filter((a) => a.role === "presiding_officer");
  const members = DEMO_ACCOUNTS.filter((a) => a.role === "member");

  const AccountButton = ({ a }: { a: DemoAccount }) => (
    <button
      type="button"
      onClick={() => signIn(a.id)}
      className="flex w-full items-center gap-3 rounded-lg border border-border/70 bg-white/70 p-3 text-left transition-colors hover:border-primary hover:bg-white"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        {a.role === "presiding_officer" ? (
          <ShieldCheck className="size-5" />
        ) : (
          <UserRound className="size-5" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{a.name}</div>
        <div className="truncate text-xs text-muted-foreground">
          {a.roleLabel}
          {a.district ? ` · ${a.district}` : ""}
        </div>
      </div>
    </button>
  );

  return (
    <Card className="w-full max-w-md border-white/60 bg-white/85 text-foreground shadow-2xl backdrop-blur-md">
      <CardHeader className="text-center">
        <Image
          src="/santa-cruz-seal.png"
          alt="Official seal of the Municipality of Santa Cruz, Zambales"
          width={88}
          height={88}
          priority
          className="mx-auto drop-shadow-sm"
        />
        <div className="mt-2 font-heading text-xl font-bold tracking-tight text-primary">
          Sangguniang Bayan ng Santa Cruz
        </div>
        <div className="text-xs text-muted-foreground">
          Santa Cruz Legislative E-Archive &amp; Session · Lalawigan ng Zambales
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-center text-sm font-medium">
          Mabuhay! Select your account to sign in.
        </p>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Presiding officer
            <Badge className="ml-auto">Full access</Badge>
          </div>
          {presiding.map((a) => (
            <AccountButton key={a.id} a={a} />
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Councilors (Sangguniang Bayan)
            <Badge variant="secondary" className="ml-auto">
              Member access
            </Badge>
          </div>
          {members.map((a) => (
            <AccountButton key={a.id} a={a} />
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Demo only — no password required.{" "}
          <Link
            href="/portal"
            className="underline underline-offset-2 hover:text-foreground"
          >
            View public portal →
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
