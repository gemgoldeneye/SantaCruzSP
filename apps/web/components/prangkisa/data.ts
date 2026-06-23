/* ============================================================
   PRANGKISA — MTOP module catalogs.

   Platform-standard (same across LGUs): application types, the
   document checklist matrix, workflow stages, payment methods.

   The authoritative per-LGU reference data — franchise zones,
   TODAs, and the fee schedule — now lives in the active
   @lgu/<name> config and is seeded into the DB + synced to the
   client (zones are already consumed from the synced store).
   The TODAS / FEES below remain only as ILLUSTRATIVE apply-wizard
   preview; deduping them onto the synced/config source (which
   needs an itemized-vs-consolidated fee-model decision) is a
   tracked follow-up.
   ============================================================ */

import type {
  AppTypeId,
  IconName,
  StageId,
  Tone,
} from "./types";

export interface AppType {
  id: AppTypeId;
  label: string;
  title: string;
  desc: string;
  sb: boolean;
  tone: Tone;
  icon: IconName;
}

/** Application types (§3). */
export const APP_TYPES: AppType[] = [
  {
    id: "NEW_MTOP",
    label: "New Franchise",
    title: "New Franchise Application",
    desc: "Apply for a brand-new MTOP. Draws and awards a franchise number from your zone's vacant pool.",
    sb: true,
    tone: "navy",
    icon: "plus",
  },
  {
    id: "RENEWAL",
    label: "Renewal of MTOP",
    title: "Renewal of MTOP",
    desc: "Renew an expiring franchise. Auto-populates from your prior record — review and confirm.",
    sb: true,
    tone: "blue",
    icon: "refresh",
  },
  {
    id: "CHANGE_MOTOR",
    label: "Change Motor",
    title: "Change Motor Application",
    desc: "Replace the registered unit under an existing MTOP. Requires certification from a certified automotive source.",
    sb: true,
    tone: "violet",
    icon: "wrench",
  },
  {
    id: "DROPPING",
    label: "Order of Dropping",
    title: "Order of Dropping of MTOP",
    desc: "Voluntarily surrender a franchise. Returns the franchise number to the zone's vacant pool.",
    sb: true,
    tone: "red",
    icon: "minus",
  },
];

type DocMatrixValue = boolean | "new";

export interface DocDef {
  id: string;
  name: string;
  sub: string;
  m: Record<AppTypeId, DocMatrixValue>;
}

export interface DocFor extends DocDef {
  newUnit: boolean;
}

/** Document checklist matrix (§4.1). value: true = required, "new" = required for new unit, false = n/a. */
export const DOCS: DocDef[] = [
  { id: "form", name: "Accomplished application form", sub: "Signed Prangkisa intake form", m: { NEW_MTOP: true, RENEWAL: true, DROPPING: true, CHANGE_MOTOR: true } },
  { id: "orcr", name: "LTO OR / CR", sub: "In applicant's name", m: { NEW_MTOP: true, RENEWAL: true, DROPPING: false, CHANGE_MOTOR: "new" } },
  { id: "brgy", name: "Barangay Clearance / Certification", sub: "From barangay of residence", m: { NEW_MTOP: true, RENEWAL: true, DROPPING: false, CHANGE_MOTOR: false } },
  { id: "toda", name: "TODA Certification / Endorsement", sub: "From your association", m: { NEW_MTOP: true, RENEWAL: true, DROPPING: false, CHANGE_MOTOR: false } },
  { id: "id", name: "Valid government ID", sub: "Any PhilSys / LTO / postal ID", m: { NEW_MTOP: true, RENEWAL: true, DROPPING: true, CHANGE_MOTOR: true } },
  { id: "prevmtop", name: "Previous MTOP", sub: "Current franchise certificate", m: { NEW_MTOP: false, RENEWAL: true, DROPPING: true, CHANGE_MOTOR: true } },
  { id: "stencil", name: "Stencil — motor & chassis number", sub: "Engine and chassis rub", m: { NEW_MTOP: true, RENEWAL: true, DROPPING: false, CHANGE_MOTOR: "new" } },
  { id: "tpl", name: "Insurance (TPL)", sub: "Third-party liability — confirm", m: { NEW_MTOP: true, RENEWAL: true, DROPPING: false, CHANGE_MOTOR: true } },
  { id: "nbi", name: "Police / NBI clearance", sub: "Confirm per local ordinance", m: { NEW_MTOP: true, RENEWAL: false, DROPPING: false, CHANGE_MOTOR: false } },
  { id: "cedula", name: "Cedula / CTC", sub: "Community tax certificate", m: { NEW_MTOP: true, RENEWAL: true, DROPPING: false, CHANGE_MOTOR: true } },
  { id: "auto", name: "Cert. from Certified Automotive", sub: "Required for change of motor", m: { NEW_MTOP: false, RENEWAL: false, DROPPING: false, CHANGE_MOTOR: true } },
];

export function docsFor(typeId: AppTypeId): DocFor[] {
  return DOCS.filter((d) => d.m[typeId]).map((d) => ({
    ...d,
    newUnit: d.m[typeId] === "new",
  }));
}

export interface Zone {
  id: string;
  name: string;
  kind: "Poblacion" | "Rural";
  cap: number;
  used: number;
  frozen: boolean;
}

export const TODAS: string[] = [
  "Santa Cruz Public Market TODA",
  "Poblacion Central TODA",
  "Amungan Drivers' TODA",
  "Palanginan United TODA",
  "Bayto–Sta. Barbara TODA",
  "Capitol Site TODA",
];

export interface FeeLine {
  k: string;
  v: number;
  confirm: boolean;
}

/** Fee schedule (§4.2). Figures are ILLUSTRATIVE placeholders.
 *  Only confirmed Santa Cruz figure: certified copy = ₱100/page. */
export const FEES: Record<AppTypeId, FeeLine[]> = {
  NEW_MTOP: [
    { k: "Filing fee", v: 150, confirm: true },
    { k: "Franchise fee", v: 1000, confirm: true },
    { k: "MTOP / issuance fee", v: 500, confirm: true },
    { k: "Body number fee", v: 120, confirm: true },
    { k: "Inspection / stencil fee", v: 100, confirm: true },
  ],
  RENEWAL: [
    { k: "Filing fee", v: 150, confirm: true },
    { k: "Renewal fee", v: 800, confirm: true },
    { k: "MTOP / issuance fee", v: 500, confirm: true },
    { k: "Inspection / stencil fee", v: 100, confirm: true },
  ],
  CHANGE_MOTOR: [
    { k: "Filing fee", v: 150, confirm: true },
    { k: "Amendment fee", v: 400, confirm: true },
    { k: "Body number fee", v: 120, confirm: true },
    { k: "Inspection / stencil fee", v: 100, confirm: true },
  ],
  DROPPING: [
    { k: "Filing fee", v: 150, confirm: true },
    { k: "Certified copy of resolution (1 pg)", v: 100, confirm: false },
  ],
};

export function feeTotal(typeId: AppTypeId): number {
  return (FEES[typeId] || []).reduce((s, f) => s + f.v, 0);
}

export interface StageDef {
  id: StageId;
  name: string;
  short: string;
  icon: IconName;
}

/** Workflow stages (§6). */
export const STAGES: StageDef[] = [
  { id: "created", name: "Application created", short: "Filed", icon: "file" },
  { id: "validation", name: "Auto-validation", short: "Validated", icon: "check" },
  { id: "inspection", name: "Inspection & stencil", short: "Inspection", icon: "search" },
  { id: "payment", name: "Order of payment", short: "Payment", icon: "card" },
  { id: "sb", name: "SB action", short: "SB session", icon: "gavel" },
  { id: "issued", name: "Digital MTOP issued", short: "MTOP issued", icon: "badge" },
];

export interface PayMethod {
  id: string;
  name: string;
  sub: string;
  color: string;
  short: string;
  wide?: boolean;
}

export const PAY_METHODS: PayMethod[] = [
  { id: "gcash", name: "GCash", sub: "e-wallet", color: "#0a7ff0", short: "G" },
  { id: "maya", name: "Maya", sub: "e-wallet", color: "#1d2330", short: "m" },
  { id: "card", name: "Credit / Debit card", sub: "Visa · Mastercard", color: "#1a1f71", short: "VISA", wide: true },
  { id: "bank", name: "LANDBANK / OTC", sub: "Online banking", color: "#0a7d3c", short: "LB" },
];

export function peso(n: number): string {
  return (
    "₱" +
    Number(n).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function typeById(id: AppTypeId): AppType | undefined {
  return APP_TYPES.find((t) => t.id === id);
}

export function stageIndex(id: StageId): number {
  return STAGES.findIndex((s) => s.id === id);
}
