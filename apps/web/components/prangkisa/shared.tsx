"use client";

/* ============================================================
   PRANGKISA — shared UI built on the SP Sanggunian design system
   (shadcn + Tailwind tokens + lucide). No bespoke branding.
   ============================================================ */

import { type ComponentType, type ReactNode } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight,
  CircleMinus,
  CreditCard,
  FileText,
  Gavel,
  Plus,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import { useSpConfig } from "@gelabs/sp/ui/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { typeById } from "./data";
import { QR } from "./qr";
import type { AppTypeId, Go, RouteName, StageId } from "./types";

/** Native form controls, styled to match the app's <Input>/<textarea> (see citizen-portal). */
export const inputClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";
export const selectClass = cn(inputClass, "pr-8");

export const TYPE_ICON: Record<AppTypeId, ComponentType<{ className?: string }>> = {
  NEW_MTOP: Plus,
  RENEWAL: RefreshCw,
  CHANGE_MOTOR: Wrench,
  DROPPING: CircleMinus,
};

export const STAGE_ICON: Record<StageId, ComponentType<{ className?: string }>> = {
  created: FileText,
  validation: BadgeCheck,
  inspection: ScanSearch,
  payment: CreditCard,
  sb: Gavel,
  issued: ShieldCheck,
};

const STAGE_BADGE: Record<StageId, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  created: { label: "Filed", variant: "outline" },
  validation: { label: "Validating", variant: "secondary" },
  inspection: { label: "Inspection", variant: "secondary" },
  payment: { label: "Awaiting payment", variant: "secondary" },
  sb: { label: "SB session", variant: "secondary" },
  issued: { label: "MTOP issued", variant: "default" },
};

export function StatusBadge({ stage }: { stage: StageId }) {
  const meta = STAGE_BADGE[stage];
  const Icon = STAGE_ICON[stage];
  return (
    <Badge variant={meta.variant}>
      <Icon /> {meta.label}
    </Badge>
  );
}

export function TypeBadge({ type }: { type: AppTypeId }) {
  const t = typeById(type);
  const Icon = TYPE_ICON[type];
  return (
    <Badge variant="outline">
      <Icon /> {t ? t.label : type}
    </Badge>
  );
}

/** Stat tile matching the app's bordered-card look. */
export function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <span className="font-medium">{label}</span>
      </div>
      <div className="mt-2 font-heading text-3xl font-bold tracking-tight tabular-nums">
        {value}
      </div>
    </div>
  );
}

/* ---------- DIGITAL MTOP CREDENTIAL (navy = the LGU's --sp-header brand) ---------- */

function SealChip({ size = 40 }: { size?: number }) {
  const cfg = useSpConfig();
  const inner = Math.round(size * 0.8);
  return (
    <span
      className="grid shrink-0 place-items-center rounded-lg bg-white shadow-sm"
      style={{ width: size, height: size }}
    >
      <img src={cfg.municipality.sealSrc} alt={`Seal of the ${cfg.municipality.name}`} width={inner} height={inner} />
    </span>
  );
}

export function CredStatus({
  label,
  tone = "active",
}: {
  label: string;
  tone?: "active" | "warn";
}) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-white">
      <span className={cn("size-1.5 rounded-full", tone === "active" ? "bg-emerald-400" : "bg-amber-300")} />
      {label}
    </span>
  );
}

export interface CredField {
  k: string;
  v: ReactNode;
}

export function CredentialCard({
  kicker,
  title,
  status,
  number,
  numberClass = "text-3xl",
  fields,
  qrValue,
  qrSize = 96,
  qrCaption,
  footer,
  sealSize = 40,
}: {
  kicker: string;
  title: ReactNode;
  status?: ReactNode;
  number: ReactNode;
  numberClass?: string;
  fields: CredField[];
  qrValue?: string;
  qrSize?: number;
  qrCaption?: ReactNode;
  footer?: ReactNode;
  sealSize?: number;
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-[var(--sp-header)] text-white shadow-sm ring-1 ring-black/10">
      <div className="flex items-center gap-3 border-b border-white/12 px-5 py-4">
        <SealChip size={sealSize} />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold tracking-[0.14em] text-white/60 uppercase">
            {kicker}
          </div>
          <div className="font-heading text-sm leading-tight font-semibold">{title}</div>
        </div>
        {status}
      </div>
      <div className="flex gap-5 px-5 py-5">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold tracking-[0.12em] text-white/55 uppercase">
            Franchise number
          </div>
          <div className={cn("font-heading font-bold tracking-wide", numberClass)}>{number}</div>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
            {fields.map((f, i) => (
              <div key={i} className="min-w-0">
                <div className="text-[10px] font-bold tracking-[0.12em] text-white/55 uppercase">
                  {f.k}
                </div>
                <div className="mt-0.5 truncate text-sm font-semibold">{f.v}</div>
              </div>
            ))}
          </div>
        </div>
        {qrValue && (
          <div className="shrink-0 text-center">
            <div className="rounded-xl bg-white p-2">
              <QR value={qrValue} size={qrSize} />
            </div>
            {qrCaption && (
              <div className="mt-1.5 text-[10px] font-bold tracking-[0.12em] text-white/55 uppercase">
                {qrCaption}
              </div>
            )}
          </div>
        )}
      </div>
      {footer && (
        <div className="flex items-center gap-2.5 border-t border-white/12 bg-white/5 px-5 py-3.5 text-xs text-white/75">
          {footer}
        </div>
      )}
    </div>
  );
}

/* ---------- VIEW HEADER (breadcrumb + title + actions) ---------- */

export interface Crumb {
  label: string;
  to?: RouteName;
}

export function ViewHeader({
  crumbs,
  go,
  back,
  title,
  description,
  badges,
  actions,
}: {
  crumbs?: Crumb[];
  go?: Go;
  back?: () => void;
  title: string;
  description?: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="space-y-3">
      {(crumbs || back) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {back && (
            <Button variant="ghost" size="sm" onClick={back} className="-ml-2 h-7">
              <ArrowLeft /> Back
            </Button>
          )}
          {crumbs?.map((c, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <ChevronRight className="size-3.5 opacity-50" />}
              {c.to && go ? (
                <button onClick={() => go(c.to!)} className="font-medium transition-colors hover:text-foreground">
                  {c.label}
                </button>
              ) : (
                <span className="text-foreground">{c.label}</span>
              )}
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-2xl font-semibold tracking-tight">{title}</h2>
            {badges}
          </div>
          {description && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/** Expiring / active pill used on the dashboard credential cards. */
export function mtopStatus(status: "active" | "expiring") {
  return status === "expiring" ? (
    <CredStatus label="Expiring soon" tone="warn" />
  ) : (
    <CredStatus label="Active" tone="active" />
  );
}

/** Small labelled key/value row used inside light cards. */
export function InfoRow({ k, v }: { k: ReactNode; v: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-2.5 last:border-0">
      <span className="text-sm text-muted-foreground">{k}</span>
      <span className="text-right text-sm font-medium">{v || "—"}</span>
    </div>
  );
}

export function SectionLabel({ children, icon: Icon }: { children: ReactNode; icon?: ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {Icon && <Icon className="size-3.5" />}
      {children}
    </div>
  );
}
