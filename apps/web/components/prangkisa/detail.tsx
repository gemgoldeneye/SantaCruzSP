"use client";

import { Check, Clock, CreditCard, FileText, Gavel, Info, MapPin, QrCode, Sparkles, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useSpConfig, useCopy } from "@gelabs/sp/ui/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { STAGES, docsFor, peso, stageIndex, typeById } from "./data";
import {
  InfoRow,
  STAGE_ICON,
  SectionLabel,
  StatusBadge,
  TypeBadge,
  ViewHeader,
} from "./shared";
import type { Application, Go, RouteParams, StageId, Store } from "./types";

type StepState = "done" | "active" | "pending";

function StageAction({ app, stage, go, store }: { app: Application; stage: StageId; go: Go; store: Store }) {
  const cfg = useSpConfig();
  const copy = useCopy();
  const tl = app.timeline[stage] || {};

  if (tl.action && stage === "validation") {
    return (
      <div className="mt-3 rounded-lg border bg-muted/40 p-4">
        <div className="flex items-start gap-2 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p>{tl.note}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="mt-3"
          onClick={() =>
            store.update(app.ref, (a) => ({
              ...a,
              stage: "inspection",
              updated: "Just now",
              timeline: {
                ...a.timeline,
                validation: { at: "Just now", by: "Auto-validated — checklist complete" },
                inspection: {
                  action: true,
                  note: "Schedule your motor & chassis stencil. MTO runs Zone site-days; pick a slot.",
                },
              },
            }))
          }
        >
          <Upload /> Upload missing document
        </Button>
      </div>
    );
  }

  if (tl.action && stage === "inspection") {
    return (
      <div className="mt-3 rounded-lg border bg-muted/40 p-4">
        <div className="text-sm font-medium">Schedule inspection &amp; stencil</div>
        <p className="mt-0.5 text-sm text-muted-foreground">{tl.note}</p>
        <Button
          size="sm"
          className="mt-3"
          onClick={() =>
            store.update(app.ref, (a) => ({
              ...a,
              stage: "payment",
              updated: "Just now",
              timeline: {
                ...a.timeline,
                inspection: {
                  at: "Jun 12, 2026 · 9:00 AM",
                  by: "MTO Inspector R. Novelo · " + a.zone + " site-day · stencil verified, geo-tagged",
                },
                payment: {
                  action: true,
                  note: `Inspection passed. Order of payment generated per ${copy("revenueOrdinance", cfg.defaultLang)}.`,
                },
              },
            }))
          }
        >
          <MapPin /> Confirm {app.zone} site-day · Jun 12
        </Button>
        <p className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="size-3.5" /> Only this step keeps a physical component — bring the unit for motor/chassis
          stencil.
        </p>
      </div>
    );
  }

  if (tl.action && stage === "payment") {
    return (
      <div className="mt-3 rounded-lg border bg-muted/40 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium">Order of payment ready</div>
            <p className="mt-0.5 text-sm text-muted-foreground">{tl.note}</p>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Amount due</div>
            <div className="font-heading text-xl font-bold tabular-nums">{peso(app.amount)}</div>
          </div>
        </div>
        <Button size="sm" className="mt-3" onClick={() => go("payment", { ref: app.ref })}>
          <CreditCard /> Pay online now
        </Button>
      </div>
    );
  }

  if (tl.action && stage === "sb") {
    return (
      <div className="mt-3 rounded-lg border bg-muted/40 p-4">
        <div className="text-sm font-medium">Endorsed — calendared for SB session</div>
        <p className="mt-0.5 text-sm text-muted-foreground">{tl.note}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="secondary">
            <Gavel /> Agenda item · SB session Jun 18
          </Badge>
          <Badge variant="outline">
            <Clock /> Quorum &amp; voting via legislative module
          </Badge>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="mt-3"
          onClick={() => {
            const num =
              app.franchise && app.franchise.startsWith("STC")
                ? app.franchise
                : "STC-" + (app.zone || "Z6").replace(/\D/g, "Z").slice(0, 2) + "-00" + (50 + Math.floor(Math.random() * 49));
            const res = "SB Res. No. 2026-0" + (78 + Math.floor(Math.random() * 21));
            store.update(app.ref, (a) => ({
              ...a,
              stage: "issued",
              updated: "Just now",
              franchise: num,
              resolution: res,
              validity: "Jun 18, 2026 — Jun 18, 2029",
              timeline: {
                ...a.timeline,
                sb: { at: "Jun 18, 2026", by: "Approved — " + res + " (Vice Mayor presiding)" },
                issued: { at: "Jun 18, 2026", by: "Digital MTOP issued · QR-verifiable · LTO-ready" },
              },
            }));
          }}
        >
          <Sparkles /> Simulate SB approval (demo)
        </Button>
      </div>
    );
  }

  return null;
}

function StageBody({
  app,
  stage,
  state,
  go,
  store,
}: {
  app: Application;
  stage: StageId;
  state: StepState;
  go: Go;
  store: Store;
}) {
  const tl = app.timeline[stage] || {};
  if (state !== "active") {
    return (
      <div className="mt-0.5 text-sm text-muted-foreground">
        {tl.at ? `${tl.at}${tl.by ? " · " + tl.by : ""}` : "Pending"}
      </div>
    );
  }
  const action = <StageAction app={app} stage={stage} go={go} store={store} />;
  if (action) return action;
  return <div className="mt-0.5 text-sm text-muted-foreground">{tl.note || "In progress…"}</div>;
}

function Timeline({ app, go, store }: { app: Application; go: Go; store: Store }) {
  const curIdx = stageIndex(app.stage);
  return (
    <div>
      {STAGES.map((s, i) => {
        const tl = app.timeline[s.id] || {};
        const state: StepState =
          i < curIdx || (i === curIdx && tl.at && !tl.action) ? "done" : i === curIdx ? "active" : "pending";
        const Icon = STAGE_ICON[s.id];
        const last = i === STAGES.length - 1;
        return (
          <div key={s.id} className="grid grid-cols-[auto_1fr] gap-x-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full border-2",
                  state === "done"
                    ? "border-primary bg-primary text-primary-foreground"
                    : state === "active"
                      ? "border-primary bg-card text-primary ring-4 ring-primary/15"
                      : "border-border bg-card text-muted-foreground",
                )}
              >
                {state === "done" ? <Check className="size-4" /> : <Icon className="size-4" />}
              </div>
              {!last && (
                <div className={cn("my-1 min-h-6 w-0.5 flex-1", state === "done" ? "bg-primary" : "bg-border")} />
              )}
            </div>
            <div className={cn(last ? "pb-0" : "pb-6")}>
              <div className="flex items-center justify-between gap-2">
                <div className="font-heading text-base font-semibold">{s.name}</div>
                {state === "done" && (
                  <Badge variant="secondary">
                    <Check /> Done
                  </Badge>
                )}
                {state === "active" && <Badge variant="outline">In progress</Badge>}
              </div>
              <StageBody app={app} stage={s.id} state={state} go={go} store={store} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AppDetail({ go, params, store }: { go: Go; params: RouteParams; store: Store }) {
  const app = params.ref ? store.getApp(params.ref) : undefined;
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
  const docs = docsFor(app.type);
  const uploadedMap = app.documents ?? {};
  const uploadedCount = docs.filter((d) => uploadedMap[d.id]).length;
  const docsComplete = uploadedCount === docs.length;

  return (
    <div className="space-y-6">
      <ViewHeader
        crumbs={[{ label: "Franchising", to: "dashboard" }, { label: app.ref }]}
        go={go}
        title={app.ref}
        badges={
          <>
            <TypeBadge type={app.type} />
            <StatusBadge stage={app.stage} />
          </>
        }
        description={`${app.unit} · ${app.zone}`}
        actions={
          app.stage === "issued" ? (
            <Button onClick={() => go("mtop", { no: app.franchise })}>
              <QrCode /> View MTOP
            </Button>
          ) : null
        }
      />

      {params.justSubmitted && (
        <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
          <Check className="mt-0.5 size-5 shrink-0 text-primary" />
          <p>
            <span className="font-semibold">Application {app.ref} filed and auto-validated.</span> Next: schedule your
            inspection &amp; stencil. We&apos;ll guide you through every step below.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        {/* progress */}
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b px-5 py-4">
            <span className="font-heading font-semibold">Progress</span>
            <span className="text-xs text-muted-foreground">RA 11032 · complete-or-return-once</span>
          </div>
          <div className="p-5">
            <Timeline app={app} go={go} store={store} />
          </div>
        </div>

        {/* side cards */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <SectionLabel>Applicant &amp; unit</SectionLabel>
            <div className="mt-3">
              <InfoRow k="Applicant" v={app.applicantName || "—"} />
              {app.applicantContact && (
                <InfoRow k="Contact" v={app.applicantContact} />
              )}
              <InfoRow k="TODA" v={app.toda} />
              <InfoRow k="Zone" v={app.zone} />
              <InfoRow k="Unit" v={app.unit} />
              {app.franchise && <InfoRow k="Franchise no." v={app.franchise} />}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <SectionLabel>Documents</SectionLabel>
              <Badge variant={docsComplete ? "secondary" : "outline"}>
                {docsComplete ? <Check /> : null} {uploadedCount}/{docs.length} on
                file
              </Badge>
            </div>
            <div className="mt-3 space-y-2">
              {docs.slice(0, 5).map((d) => {
                const up = !!uploadedMap[d.id];
                return (
                  <div key={d.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2">
                      <FileText className="size-3.5 text-muted-foreground" />
                      {d.name}
                    </span>
                    {up ? (
                      <Check className="size-4 text-primary" />
                    ) : (
                      <span className="text-xs font-medium text-destructive">
                        Missing
                      </span>
                    )}
                  </div>
                );
              })}
              {docs.length > 5 && (
                <div className="pt-1 text-xs text-muted-foreground">+ {docs.length - 5} more on file</div>
              )}
            </div>
          </div>

          {app.resolution && (
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <SectionLabel>SB resolution</SectionLabel>
              <div className="mt-3 flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Gavel className="size-5" />
                </span>
                <div>
                  <div className="font-semibold">{app.resolution}</div>
                  <div className="text-xs text-muted-foreground">
                    Approved in SB session · {typeById(app.type)?.label} · Vice Mayor presiding
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
