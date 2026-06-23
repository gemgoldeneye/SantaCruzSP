"use client";

import { useState } from "react";
import { ArrowRight, CreditCard, Download, Info, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { useSpConfig, useCopy } from "@gelabs/sp/ui/client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { FEES, PAY_METHODS, feeTotal, peso } from "./data";
import { QR } from "./qr";
import { SectionLabel, ViewHeader } from "./shared";
import type { Go, PayMethodId, RouteParams, Store } from "./types";

export function Payment({ go, params, store }: { go: Go; params: RouteParams; store: Store }) {
  const cfg = useSpConfig();
  const copy = useCopy();
  const app = params.ref ? store.getApp(params.ref) : undefined;
  const [method, setMethod] = useState<PayMethodId>("gcash");
  const [phase, setPhase] = useState<"form" | "qr" | "processing" | "done">(
    "form",
  );

  if (!app) {
    return (
      <div className="space-y-4">
        <ViewHeader crumbs={[{ label: "Franchising", to: "dashboard" }]} go={go} title="Application not found" />
        <Button variant="outline" onClick={() => go("dashboard")}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  const fees = FEES[app.type] || [];
  const total = feeTotal(app.type);

  const pay = () => {
    setPhase("processing");
    setTimeout(() => {
      const or = "2026-" + (44000 + Math.floor(Math.random() * 900));
      store.update(app.ref, (a) => ({
        ...a,
        stage: "sb",
        updated: "Just now",
        orNo: or,
        payMethod: method,
        timeline: {
          ...a.timeline,
          payment: { at: "Just now", by: "Paid online · OR No. " + or + " · " + peso(a.amount) },
          sb: {
            action: true,
            note: "Payment confirmed. Endorsed by the Committee on Transportation & Franchising and calendared for the next SB session.",
          },
        },
      }));
      setPhase("done");
    }, 1700);
  };

  if (phase === "qr" || phase === "processing") {
    const pm = PAY_METHODS.find((p) => p.id === method);
    const processing = phase === "processing";
    return (
      <div className="space-y-6">
        <ViewHeader
          crumbs={[
            { label: "Franchising", to: "dashboard" },
            { label: app.ref },
            { label: "Payment" },
          ]}
          go={go}
          title="Scan to pay"
        />
        <div className="mx-auto max-w-md">
          <div className="rounded-xl border bg-card p-6 text-center shadow-sm">
            <div className="flex items-center justify-center gap-2">
              <span
                className="grid h-7 w-10 shrink-0 place-items-center rounded text-xs font-bold text-white"
                style={{ background: pm?.color }}
              >
                {pm?.short}
              </span>
              <span className="text-sm font-medium">Pay via {pm?.name}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {app.ref} ·{" "}
              <span className="font-semibold text-foreground">{peso(total)}</span>
            </p>
            <div className="mx-auto mt-5 w-fit rounded-xl border bg-white p-3 shadow-sm">
              <QR value={`STC-PAY:${app.ref}:${total}:${method}`} size={184} />
            </div>
            <p className="mx-auto mt-4 flex max-w-xs items-start justify-center gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              Placeholder QR — the LGU&apos;s accredited gateway will render its
              live QR / redirect here on go-live.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => setPhase("form")}
                disabled={processing}
              >
                Back
              </Button>
              <Button onClick={pay} disabled={processing}>
                {processing ? (
                  "Processing…"
                ) : (
                  <>
                    <ShieldCheck /> I&apos;ve completed payment
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="mx-auto max-w-xl">
        <div className="rounded-xl border bg-card p-10 text-center shadow-sm">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="size-9" />
          </div>
          <h2 className="mt-5 font-heading text-2xl font-semibold">Payment received</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {peso(total)} paid for <span className="font-medium text-foreground">{app.ref}</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your application is now endorsed and calendared for the Sangguniang Bayan session.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button variant="outline" onClick={() => toast.success("Receipt downloaded (demo)")}>
              <Download /> Download receipt
            </Button>
            <Button onClick={() => go("detail", { ref: app.ref })}>
              Back to tracking <ArrowRight />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        crumbs={[
          { label: "Franchising", to: "dashboard" },
          { label: app.ref },
          { label: "Payment" },
        ]}
        go={go}
        title="Order of payment"
      />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        {/* methods */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="font-heading text-base font-semibold">Choose payment method</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Secure online payment to the Municipal Treasurer&apos;s Office. An official receipt (OR) is issued
            automatically.
          </p>
          <div className="mt-4 space-y-3">
            {PAY_METHODS.map((pm) => {
              const sel = method === pm.id;
              return (
                <button
                  key={pm.id}
                  onClick={() => setMethod(pm.id as PayMethodId)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all",
                    sel ? "border-primary ring-1 ring-primary" : "hover:border-primary/40",
                  )}
                >
                  <span
                    className="grid h-8 w-12 shrink-0 place-items-center rounded text-xs font-bold text-white"
                    style={{ background: pm.color }}
                  >
                    {pm.short}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{pm.name}</span>
                    <span className="block text-xs text-muted-foreground">{pm.sub}</span>
                  </span>
                  <span
                    className={cn(
                      "grid size-5 place-items-center rounded-full border-2",
                      sel ? "border-primary" : "border-input",
                    )}
                  >
                    {sel && <span className="size-2.5 rounded-full bg-primary" />}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>Payments are processed under the LGU&apos;s accredited gateway. No card details are stored by Prangkisa.</p>
          </div>
        </div>

        {/* summary */}
        <div className="lg:sticky lg:top-4">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <SectionLabel>Order of payment · {app.ref}</SectionLabel>
            <div className="mt-3">
              {fees.map((f) => (
                <div key={f.k} className="flex items-center justify-between gap-3 py-1.5 text-sm">
                  <span>{f.k}</span>
                  <span className="font-medium tabular-nums">{peso(f.v)}</span>
                </div>
              ))}
            </div>
            <Separator className="my-3" />
            <div className="flex items-center justify-between">
              <span className="font-semibold">Total amount due</span>
              <span className="font-heading text-2xl font-bold text-primary tabular-nums">{peso(total)}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Fees per {copy("revenueOrdinance", cfg.defaultLang)} / {copy("revenueCodeName", cfg.defaultLang)} (illustrative — confirm before go-live).
            </p>
            <Button
              size="lg"
              className="mt-4 w-full"
              onClick={() => setPhase("qr")}
            >
              <CreditCard /> Pay {peso(total)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
