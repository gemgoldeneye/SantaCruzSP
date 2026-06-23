"use client";

import { useState } from "react";
import { AlertTriangle, BadgeCheck, Download, QrCode, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { MTOPS, OPERATOR } from "./data";
import { QR } from "./qr";
import { CredStatus, CredentialCard, ViewHeader } from "./shared";
import type { Go, Mtop, RouteParams, Store } from "./types";

function resolveMtop(no: string | undefined, store: Store): Mtop | null {
  if (!no) return null;
  const m = MTOPS.find((x) => x.no === no);
  if (m) return m;
  const app = store.all().find((a) => a.franchise === no && a.stage === "issued");
  if (app) {
    const [validFrom = "—", validTo = "—"] = (app.validity || "").split(" — ");
    return {
      no,
      status: "active",
      class: "Public tricycle-for-hire",
      zone: app.zone,
      toda: app.toda,
      unit: app.unit,
      operator: OPERATOR.name,
      validFrom,
      validTo,
      resolution: app.resolution || "—",
    };
  }
  return null;
}

export function MtopView({ go, params, store }: { go: Go; params: RouteParams; store: Store }) {
  const m = resolveMtop(params.no, store);
  if (!m) {
    return (
      <div className="space-y-4">
        <ViewHeader crumbs={[{ label: "Franchising", to: "dashboard" }]} go={go} title="MTOP not found" />
        <Button variant="outline" onClick={() => go("dashboard")}>
          Back to dashboard
        </Button>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <ViewHeader
        crumbs={[{ label: "Franchising", to: "dashboard" }, { label: m.no }]}
        go={go}
        title="Digital MTOP"
        description="QR-verifiable, LTO-ready franchise credential. Present at roadside checks or save to your device."
      />

      <CredentialCard
        kicker="Republic of the Philippines · Municipality of Santa Cruz, Zambales"
        title="Motorized Tricycle Operator's Permit"
        status={<CredStatus label="Active" />}
        number={m.no}
        numberClass="text-4xl"
        sealSize={44}
        fields={[
          { k: "Operator", v: m.operator },
          { k: "Class", v: m.class },
          { k: "Zone", v: m.zone },
          { k: "TODA", v: m.toda },
          { k: "Unit", v: m.unit },
          { k: "SB resolution", v: m.resolution },
          { k: "Valid from", v: m.validFrom },
          { k: "Valid until", v: m.validTo },
        ]}
        qrValue={m.no}
        qrSize={128}
        qrCaption="Scan to verify"
        footer={
          <>
            <ShieldCheck className="size-4 shrink-0 text-emerald-300" />
            <span>
              Issued via the LGU Santa Cruz Sanggunian App · revocable privilege under the Tricycle Franchising Ordinance, not a right.
            </span>
          </>
        }
      />

      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="outline" onClick={() => toast.success("MTOP PDF downloaded (demo)")}>
          <Download /> Download PDF
        </Button>
        <Button variant="outline" onClick={() => toast.success("Added to wallet (demo)")}>
          <BadgeCheck /> Add to wallet
        </Button>
        <Button onClick={() => go("verify", { no: m.no })}>
          <QrCode /> Open public verify
        </Button>
      </div>
    </div>
  );
}

/* ---------- PUBLIC VERIFY ---------- */
export function Verify({ go, params, store }: { go: Go; params: RouteParams; store: Store }) {
  const [q, setQ] = useState(params.no || "");
  const [result, setResult] = useState<Mtop | null | undefined>(
    params.no ? resolveMtop(params.no, store) : undefined,
  );
  const [scanned, setScanned] = useState(!!params.no);

  const run = (val?: string) => {
    setResult(resolveMtop((val || q).trim(), store) || null);
    setScanned(true);
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
          <QrCode className="size-7" />
        </div>
        <h2 className="mt-4 font-heading text-2xl font-semibold">Verify an MTOP</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Roadside check by Traffic Enforcement / PNP. Scan the QR or enter a franchise number.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. STC-LN-0052"
            onKeyDown={(e) => e.key === "Enter" && run()}
          />
          <Button onClick={() => run()}>
            <Search /> Verify
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Try:</span>
          {["STC-LN-0052", "STC-PS-0418", "STC-XX-9999"].map((s) => (
            <Button
              key={s}
              variant="outline"
              size="sm"
              className="font-mono"
              onClick={() => {
                setQ(s);
                run(s);
              }}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {scanned && result === null && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" />
          </div>
          <h3 className="mt-3 font-heading text-lg font-semibold">No valid MTOP found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            &ldquo;{q}&rdquo; is not an active franchise on record in Santa Cruz. Flag for inspection.
          </p>
        </div>
      )}

      {result && (
        <div className="overflow-hidden rounded-xl border border-primary/30">
          <div className="flex items-center gap-3 border-b border-primary/20 bg-primary/5 px-5 py-4">
            <ShieldCheck className="size-6 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-primary">
                Valid · {result.status === "expiring" ? "Active (expiring soon)" : "Active franchise"}
              </div>
              <div className="text-xs text-muted-foreground">
                Verified against current LGU Santa Cruz records
              </div>
            </div>
            <div className="shrink-0 rounded-lg border bg-white p-1">
              <QR value={result.no} size={52} />
            </div>
          </div>
          <div className="p-5">
            <div className="font-heading text-2xl font-bold">{result.no}</div>
            <div className="mt-3 grid grid-cols-2 gap-4">
              {[
                { k: "Operator", v: result.operator },
                { k: "Zone", v: result.zone },
                { k: "Unit", v: result.unit },
                { k: "Valid until", v: result.validTo },
              ].map((f) => (
                <div key={f.k}>
                  <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{f.k}</div>
                  <div className="mt-0.5 font-medium">{f.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="text-center text-sm">
        <button
          onClick={() => go("dashboard")}
          className={cn("font-medium text-primary transition-colors hover:underline")}
        >
          ← Back to dashboard
        </button>
      </p>
    </div>
  );
}
