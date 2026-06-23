/* ============================================================
   PRANGKISA — shared runtime types
   Tricycle Franchise & MTOP module · LGU Santa Cruz Sanggunian App
   ============================================================ */

export type IconName =
  | "dashboard" | "file" | "check" | "search" | "card" | "gavel" | "badge"
  | "plus" | "minus" | "refresh" | "wrench" | "bell" | "logout" | "chevron"
  | "back" | "forward" | "user" | "truck" | "map" | "upload" | "doc" | "shield"
  | "qr" | "clock" | "alert" | "info" | "pin" | "download" | "building" | "hash"
  | "sun" | "moon" | "spark" | "scale";

export type AppTypeId = "NEW_MTOP" | "RENEWAL" | "CHANGE_MOTOR" | "DROPPING";

export type StageId =
  | "created"
  | "validation"
  | "inspection"
  | "payment"
  | "sb"
  | "issued";

export type Tone =
  | "gray"
  | "navy"
  | "blue"
  | "amber"
  | "green"
  | "red"
  | "violet";

export interface TimelineEntry {
  at?: string;
  by?: string;
  action?: boolean;
  note?: string;
}

export type Timeline = Partial<Record<StageId, TimelineEntry>>;

export interface Application {
  ref: string;
  type: AppTypeId;
  unit: string;
  plate: string;
  zone: string;
  toda: string;
  stage: StageId;
  updated: string;
  amount: number;
  franchise: string;
  validity?: string;
  resolution?: string;
  orNo?: string;
  timeline: Timeline;
  _new?: boolean;
}

export interface Mtop {
  no: string;
  status: "active" | "expiring";
  class: string;
  zone: string;
  toda: string;
  unit: string;
  operator: string;
  validFrom: string;
  validTo: string;
  resolution: string;
}

/** Client-side store mirroring the prototype's `useStore`. */
export interface Store {
  all: () => Application[];
  getApp: (ref: string) => Application | undefined;
  upsert: (app: Application) => void;
  update: (ref: string, fn: (a: Application) => Application) => void;
}

export type RouteName =
  | "dashboard"
  | "apply"
  | "detail"
  | "payment"
  | "mtop"
  | "verify";

export interface RouteParams {
  ref?: string;
  no?: string;
  app?: Application;
  preType?: AppTypeId;
  franchise?: string;
  justSubmitted?: boolean;
}

export interface Route {
  name: RouteName;
  params: RouteParams;
}

/** Navigate; if `params.app` is present it is upserted into the store first. */
export type Go = (name: RouteName, params?: RouteParams) => void;
