"use client";

import { Fragment, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Info,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useSpConfig, useCopy } from "@gelabs/sp/ui/client";

import {
  APP_TYPES,
  FEES,
  TODAS,
  docsFor,
  feeTotal,
  peso,
  typeById,
} from "./data";
import type { Zone } from "./data";
import { CredentialCard, TYPE_ICON, ViewHeader, selectClass } from "./shared";
import type { AppTypeId, Go, RouteParams, StageId, Store } from "./types";

const WSTEPS = [
  { id: "type", label: "Type" },
  { id: "details", label: "Applicant & unit" },
  { id: "docs", label: "Documents" },
  { id: "review", label: "Review" },
];

interface FormData {
  type: AppTypeId | "";
  name: string;
  contact: string;
  address: string;
  zone: string;
  toda: string;
  plate: string;
  chassis: string;
  franchise: string;
  uploaded: Record<string, boolean>;
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex flex-wrap items-center gap-y-2">
      {WSTEPS.map((s, i) => (
        <Fragment key={s.id}>
          {i > 0 && (
            <div className={cn("mx-2 h-px w-5 sm:w-9", i <= step ? "bg-primary" : "bg-border")} />
          )}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold",
                i <= step
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              {i < step ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span
              className={cn(
                "hidden text-sm font-medium sm:inline",
                i === step ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {s.label}
            </span>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

function LivePreview({ data }: { data: FormData }) {
  const cfg = useSpConfig();
  const copy = useCopy();
  const t = data.type ? typeById(data.type) : null;
  const total = data.type ? feeTotal(data.type) : 0;
  return (
    <div className="space-y-3 lg:sticky lg:top-4">
      <CredentialCard
        kicker="Live application preview"
        title={t ? t.title : "Select a type"}
        number={data.type === "NEW_MTOP" ? "— on award —" : data.franchise || "—"}
        numberClass="text-2xl"
        fields={[
          { k: "Applicant", v: data.name || "—" },
          { k: "Zone", v: data.zone || "—" },
          { k: "Unit / plate", v: data.plate || "—" },
          { k: "TODA", v: data.toda || "—" },
          { k: "Class", v: "Public for-hire" },
          { k: "Validity", v: "3 years" },
        ]}
        qrValue={data.type || "PRG"}
        qrSize={64}
        footer={
          <span className="flex w-full items-center justify-between">
            <span className="text-[10px] font-bold tracking-[0.12em] text-white/55 uppercase">
              Estimated fees
            </span>
            <span className="font-heading text-base font-bold text-white">{peso(total)}</span>
          </span>
        }
      />
      <p className="text-center text-xs text-muted-foreground">
        Issued only after SB session approval. Fees are illustrative — confirm vs. {copy("revenueOrdinance", cfg.defaultLang)}.
      </p>
    </div>
  );
}

/* ---------- STEP 1: type ---------- */
function StepType({ data, set }: { data: FormData; set: (p: Partial<FormData>) => void }) {
  const cfg = useSpConfig();
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-heading text-lg font-semibold">What would you like to do?</h3>
        <p className="text-sm text-muted-foreground">
          {cfg.municipality.shortName}&apos;s charter lists four front-line franchising services. Pick one.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {APP_TYPES.map((t) => {
          const Icon = TYPE_ICON[t.id];
          const sel = data.type === t.id;
          return (
            <button
              key={t.id}
              onClick={() => set({ type: t.id })}
              className={cn(
                "relative flex gap-4 rounded-xl border p-4 text-left transition-all",
                sel ? "border-primary ring-1 ring-primary" : "hover:border-primary/50 hover:bg-muted/40",
              )}
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{t.label}</div>
                <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                  {t.id}
                  {t.sb && " · to SB session"}
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">{t.desc}</p>
              </div>
              {sel && (
                <span className="absolute top-3 right-3 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- STEP 2: applicant & unit ---------- */
function LabelledField({
  label,
  req,
  hint,
  children,
}: {
  label: string;
  req?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-sm font-medium">
        {label} {req && <span className="text-destructive">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function StepDetails({
  data,
  set,
  zones,
}: {
  data: FormData;
  set: (p: Partial<FormData>) => void;
  zones: Zone[];
}) {
  const cfg = useSpConfig();
  const linked = data.type === "RENEWAL" || data.type === "CHANGE_MOTOR" || data.type === "DROPPING";
  return (
    <div className="space-y-5">
      {linked && (
        <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            Linked to franchise <span className="font-semibold">{data.franchise || "STC-Z2-0418"}</span>.
            Fields auto-populated from your prior record — review and update if needed.
          </p>
        </div>
      )}
      <div>
        <h3 className="mb-3 font-heading text-base font-semibold">Applicant details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <LabelledField label="Full name" req>
            <Input value={data.name} onChange={(e) => set({ name: e.target.value })} placeholder="Juan D. Santos" />
          </LabelledField>
          <LabelledField label="Contact number" req>
            <Input value={data.contact} onChange={(e) => set({ contact: e.target.value })} placeholder="0917 555 0000" />
          </LabelledField>
          <div className="sm:col-span-2">
            <LabelledField label="Address" req>
              <Input value={data.address} onChange={(e) => set({ address: e.target.value })} placeholder={`Zone, barangay, ${cfg.municipality.shortName}, ${cfg.municipality.province}`} />
            </LabelledField>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="mb-3 font-heading text-base font-semibold">Unit &amp; franchise</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <LabelledField label="Zone / barangay" req hint="At-capacity zones are flagged for SB deliberation.">
            <select className={selectClass} value={data.zone} onChange={(e) => set({ zone: e.target.value })}>
              <option value="">Select zone…</option>
              <optgroup label="Poblacion">
                {zones.filter((z) => z.kind === "Poblacion").map((z) => (
                  <option key={z.id} value={z.name}>
                    {z.name}
                    {z.frozen ? " — frozen (full)" : z.used >= z.cap ? " — at capacity" : ""}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Rural barangay">
                {zones.filter((z) => z.kind === "Rural").map((z) => (
                  <option key={z.id} value={z.name}>
                    {z.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </LabelledField>
          <LabelledField label="TODA" req>
            <select className={selectClass} value={data.toda} onChange={(e) => set({ toda: e.target.value })}>
              <option value="">Select TODA…</option>
              {TODAS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </LabelledField>
          <LabelledField label="Plate / MV file number" req={data.type !== "DROPPING"}>
            <Input value={data.plate} onChange={(e) => set({ plate: e.target.value })} placeholder="ABC 1234" />
          </LabelledField>
          <LabelledField label="Engine / chassis number" hint="Verified against stencil during inspection.">
            <Input value={data.chassis} onChange={(e) => set({ chassis: e.target.value })} placeholder="Auto-read from stencil" />
          </LabelledField>
        </div>
      </div>
    </div>
  );
}

/* ---------- STEP 3: documents ---------- */
function StepDocs({ data, set }: { data: FormData; set: (p: Partial<FormData>) => void }) {
  const cfg = useSpConfig();
  const copy = useCopy();
  const docs = docsFor((data.type || "NEW_MTOP") as AppTypeId);
  const uploaded = data.uploaded;
  const missing = docs.filter((d) => !uploaded[d.id]);
  const toggle = (id: string) => set({ uploaded: { ...uploaded, [id]: !uploaded[id] } });
  const uploadAll = () => {
    const u: Record<string, boolean> = {};
    docs.forEach((d) => (u[d.id] = true));
    set({ uploaded: u });
    toast.success("Sample document set uploaded", { description: "All checklist items marked verified (demo)." });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="font-heading text-base font-semibold">Required documents</h3>
          <p className="text-sm text-muted-foreground">
            Checklist for{" "}
            <span className="font-medium text-foreground">{typeById(data.type as AppTypeId)?.label}</span> per{" "}
            {copy("revenueOrdinance", cfg.defaultLang)}.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={uploadAll}>
          <Upload /> Upload sample set
        </Button>
      </div>

      {missing.length === 0 ? (
        <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
          <Check className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            <span className="font-semibold">Checklist complete.</span> Auto-validation will pass on submit.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p>
            <span className="font-semibold">
              {missing.length} document{missing.length > 1 ? "s" : ""} pending.
            </span>{" "}
            Under RA 11032, {cfg.municipality.shortName} validates complete-or-return-once — upload everything before submitting.
          </p>
        </div>
      )}

      <div className="space-y-2.5">
        {docs.map((d) => {
          const up = !!uploaded[d.id];
          return (
            <div
              key={d.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3",
                up && "border-primary/30 bg-primary/5",
              )}
            >
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-lg",
                  up ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                {up ? <Check className="size-4" /> : <Upload className="size-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {d.name}
                  {d.newUnit && <Badge variant="outline">new unit</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">
                  {up ? "Uploaded · PDF · verified" : d.sub}
                </div>
              </div>
              {up ? (
                <Button variant="ghost" size="sm" onClick={() => toggle(d.id)}>
                  Remove
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => toggle(d.id)}>
                  <Upload /> Upload
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- STEP 4: review ---------- */
function ReviewRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-2.5 last:border-0">
      <span className="text-sm text-muted-foreground">{k}</span>
      <span className="text-right text-sm font-medium">{v || "—"}</span>
    </div>
  );
}

function StepReview({ data }: { data: FormData }) {
  const t = typeById(data.type as AppTypeId);
  const fees = FEES[data.type as AppTypeId] || [];
  const docs = docsFor(data.type as AppTypeId);
  const allUp = docs.every((d) => data.uploaded[d.id]);
  return (
    <div className="space-y-4">
      <h3 className="font-heading text-base font-semibold">Review &amp; submit</h3>

      <div className="rounded-xl border p-4">
        <div className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Application
        </div>
        <ReviewRow k="Type" v={t?.title} />
        <ReviewRow k="Applicant" v={data.name} />
        <ReviewRow k="Contact" v={data.contact} />
        <ReviewRow k="Address" v={data.address} />
        <ReviewRow k="Zone" v={data.zone} />
        <ReviewRow k="TODA" v={data.toda} />
        <ReviewRow k="Plate" v={data.plate} />
      </div>

      <div className="rounded-xl border p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Documents</span>
          <Badge variant={allUp ? "default" : "destructive"}>{allUp ? "Complete" : "Incomplete"}</Badge>
        </div>
        {docs.map((d) => (
          <div key={d.id} className="flex items-center justify-between gap-3 py-1.5 text-sm">
            <span>{d.name}</span>
            {data.uploaded[d.id] ? (
              <Badge variant="secondary">
                <Check /> Uploaded
              </Badge>
            ) : (
              <Badge variant="destructive">Missing</Badge>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl border p-4">
        <div className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Order of payment (estimated)
        </div>
        {fees.map((f) => (
          <div key={f.k} className="flex items-center justify-between gap-3 py-1.5 text-sm">
            <span className="flex items-center gap-2">
              {f.k}
              {f.confirm && <Badge variant="outline" className="text-amber-600">to confirm</Badge>}
            </span>
            <span className="font-medium tabular-nums">{peso(f.v)}</span>
          </div>
        ))}
        <Separator className="my-3" />
        <div className="flex items-center justify-between">
          <span className="font-semibold">Total due on approval</span>
          <span className="font-heading text-xl font-bold text-primary tabular-nums">
            {peso(feeTotal(data.type as AppTypeId))}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------- WIZARD SHELL ---------- */
export function ApplyWizard({
  go,
  params,
  store,
  zones,
}: {
  go: Go;
  params: RouteParams;
  store: Store;
  zones: Zone[];
}) {
  const prefilled = useMemo<FormData>(() => {
    const seed: FormData = {
      type: params.preType || "",
      name: "",
      contact: "",
      address: "",
      zone: "",
      toda: "",
      plate: "",
      chassis: "",
      franchise: params.franchise || "STC-Z2-0418",
      uploaded: {},
    };
    if (params.preType && params.preType !== "NEW_MTOP") {
      return {
        ...seed,
        name: "Juan D. Santos",
        contact: "0917 555 0142",
        address: "Zone II, Poblacion, Santa Cruz, Zambales",
        zone: "Zone II",
        toda: "Poblacion Central TODA",
        plate: "ABC 1234",
      };
    }
    return seed;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [data, setData] = useState<FormData>(prefilled);
  const [step, setStep] = useState(params.preType ? 1 : 0);
  const set = (patch: Partial<FormData>) => setData((d) => ({ ...d, ...patch }));

  const canNext = [
    !!data.type,
    !!(data.name && data.contact && data.address && data.zone && data.toda && (data.type === "DROPPING" || data.plate)),
    docsFor((data.type || "NEW_MTOP") as AppTypeId).every((d) => data.uploaded[d.id]),
    true,
  ][step];

  const submit = () => {
    const ref = "PRG-2026-0" + (160 + Math.floor(Math.random() * 39));
    const stage: StageId = "inspection";
    store.upsert({
      ref,
      type: data.type as AppTypeId,
      unit: "Tricycle · " + (data.plate || "new unit"),
      plate: data.plate || "— pending",
      zone: data.zone,
      toda: data.toda,
      applicantName: data.name,
      applicantContact: data.contact,
      applicantAddress: data.address,
      stage,
      updated: "Just now",
      amount: feeTotal(data.type as AppTypeId),
      franchise: data.type === "NEW_MTOP" ? "— on award —" : data.franchise,
      documents: data.uploaded,
      timeline: {
        created: { at: "Just now", by: "Self-service (operator)" },
        validation: { at: "Just now", by: "Auto-validated — checklist complete" },
        inspection: {
          action: true,
          note: "Schedule your motor & chassis stencil. MTO runs Zone site-days; pick a slot.",
        },
      },
      _new: true,
    });
    go("detail", { ref, justSubmitted: true });
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        crumbs={[{ label: "Franchising", to: "dashboard" }, { label: "New application" }]}
        go={go}
        title="New application"
      />
      <Stepper step={step} />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          {step === 0 && <StepType data={data} set={set} />}
          {step === 1 && <StepDetails data={data} set={set} zones={zones} />}
          {step === 2 && <StepDocs data={data} set={set} />}
          {step === 3 && <StepReview data={data} />}

          <Separator className="my-5" />
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => (step === 0 ? go("dashboard") : setStep(step - 1))}>
              <ArrowLeft /> {step === 0 ? "Cancel" : "Back"}
            </Button>
            {step < 3 ? (
              <Button disabled={!canNext} onClick={() => setStep(step + 1)}>
                Continue <ArrowRight />
              </Button>
            ) : (
              <Button onClick={submit}>
                <Check /> Submit application
              </Button>
            )}
          </div>
        </div>
        <LivePreview data={data} />
      </div>
    </div>
  );
}
