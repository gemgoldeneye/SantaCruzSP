/* ============================================================
   PRANGKISA — mock data (Santa Cruz-specific, from the module spec)
   Ported from the Claude-Design prototype's data.js.
   Figures marked `confirm` are illustrative — validate against
   the Santa Cruz Tricycle Franchising Ordinance and the Santa Cruz Revised Revenue Code.
   ============================================================ */

import type {
  Application,
  AppTypeId,
  IconName,
  Mtop,
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
  { id: "nbi", name: "Police / NBI clearance", sub: "Confirm per the Franchising Ordinance", m: { NEW_MTOP: true, RENEWAL: false, DROPPING: false, CHANGE_MOTOR: false } },
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

/** Zones — Santa Cruz barangays (2 Poblacion + major rural). Caps/usage are ILLUSTRATIVE. */
export const ZONES: Zone[] = [
  { id: "PN", name: "Poblacion North", kind: "Poblacion", cap: 120, used: 118, frozen: false },
  { id: "PS", name: "Poblacion South", kind: "Poblacion", cap: 120, used: 96, frozen: false },
  { id: "B1", name: "Lucapon North", kind: "Rural", cap: 90, used: 71, frozen: false },
  { id: "B2", name: "Lucapon South", kind: "Rural", cap: 80, used: 62, frozen: false },
  { id: "B3", name: "Guisguis", kind: "Rural", cap: 70, used: 40, frozen: false },
  { id: "B4", name: "Tabalong", kind: "Rural", cap: 70, used: 70, frozen: true },
  { id: "B5", name: "Bayto", kind: "Rural", cap: 60, used: 33, frozen: false },
  { id: "B6", name: "Sabang", kind: "Rural", cap: 60, used: 29, frozen: false },
  { id: "B7", name: "Gama", kind: "Rural", cap: 60, used: 22, frozen: false },
  { id: "B8", name: "San Fernando", kind: "Rural", cap: 60, used: 25, frozen: false },
  { id: "B9", name: "Pamonoran", kind: "Rural", cap: 50, used: 18, frozen: false },
  { id: "B10", name: "Bangcol", kind: "Rural", cap: 50, used: 31, frozen: false },
  { id: "B11", name: "Babuyan", kind: "Rural", cap: 50, used: 27, frozen: false },
  { id: "B12", name: "Naulo", kind: "Rural", cap: 50, used: 19, frozen: false },
];

export const TODAS: string[] = [
  "Santa Cruz Public Market TODA",
  "Poblacion TODA",
  "Lucapon TODA",
  "Tabalong TODA",
  "Guisguis–Bayto TODA",
  "San Fernando TODA",
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

/** Sample applications (operator's own). */
export const APPLICATIONS: Application[] = [
  {
    ref: "PRG-2026-0142",
    type: "RENEWAL",
    unit: "Tricycle · ABC-1234",
    plate: "ABC 1234",
    zone: "Poblacion South",
    toda: "Poblacion TODA",
    stage: "payment",
    updated: "Jun 6, 2026",
    amount: 1550,
    franchise: "STC-PS-0418",
    timeline: {
      created: { at: "Jun 2, 2026 · 9:14 AM", by: "Self-service (operator)" },
      validation: { at: "Jun 2, 2026 · 9:20 AM", by: "Auto-validated — complete" },
      inspection: { at: "Jun 5, 2026 · 10:40 AM", by: "MTO Inspector R. Novelo · Poblacion South site-day" },
      payment: { action: true, note: "Order of payment ready. Pay online to proceed to SB endorsement." },
    },
  },
  {
    ref: "PRG-2026-0151",
    type: "CHANGE_MOTOR",
    unit: "Tricycle · new unit",
    plate: "— pending",
    zone: "Poblacion South",
    toda: "Poblacion TODA",
    stage: "validation",
    updated: "Jun 8, 2026",
    amount: 770,
    franchise: "STC-PS-0418",
    timeline: {
      created: { at: "Jun 8, 2026 · 2:05 PM", by: "Self-service (operator)" },
      validation: { action: true, note: "Cert. from Certified Automotive is missing. Upload to complete validation (complete-or-return-once)." },
    },
  },
  {
    ref: "PRG-2026-0098",
    type: "NEW_MTOP",
    unit: "Tricycle · DEF-5567",
    plate: "DEF 5567",
    zone: "Lucapon North",
    toda: "Lucapon TODA",
    stage: "issued",
    updated: "May 22, 2026",
    amount: 1870,
    franchise: "STC-LN-0052",
    validity: "May 22, 2026 — May 22, 2029",
    resolution: "SB Res. No. 2026-077",
    timeline: {
      created: { at: "Apr 28, 2026", by: "Self-service (operator)" },
      validation: { at: "Apr 28, 2026", by: "Auto-validated — complete" },
      inspection: { at: "May 4, 2026", by: "MTO Inspector R. Novelo · stencil verified" },
      payment: { at: "May 6, 2026", by: "Paid online · OR No. 2026-44102 · ₱1,870.00" },
      sb: { at: "May 20, 2026", by: "Approved — SB Res. No. 2026-077 (Vice Mayor presiding)" },
      issued: { at: "May 22, 2026", by: "Digital MTOP issued · QR-verifiable" },
    },
  },
];

/** Active MTOPs the operator holds. */
export const MTOPS: Mtop[] = [
  {
    no: "STC-LN-0052",
    status: "active",
    class: "Public tricycle-for-hire",
    zone: "Lucapon North",
    toda: "Lucapon TODA",
    unit: "Tricycle · DEF-5567",
    operator: "Juan D. Santos",
    validFrom: "May 22, 2026",
    validTo: "May 22, 2029",
    resolution: "SB Res. No. 2026-077",
  },
  {
    no: "STC-PS-0418",
    status: "expiring",
    class: "Public tricycle-for-hire",
    zone: "Poblacion South",
    toda: "Poblacion TODA",
    unit: "Tricycle · ABC-1234",
    operator: "Juan D. Santos",
    validFrom: "Jul 1, 2023",
    validTo: "Jun 30, 2026",
    resolution: "SB Res. No. 2023-051",
  },
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

export const OPERATOR = {
  name: "Juan D. Santos",
  initials: "JS",
  role: "Tricycle Operator",
  address: "Poblacion South, Santa Cruz, Zambales",
  contact: "0917 555 0142",
};

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
