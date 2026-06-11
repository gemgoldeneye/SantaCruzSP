/**
 * Demo authentication for Santa Cruz Sanggunian (front-end only — no real auth/passwords).
 * A signed-in user is just a board-member id stored in the `scleas_uid` cookie.
 * Swap this for a real identity provider later.
 */
import { memberById } from "@/lib/mock-data";

export const AUTH_COOKIE = "scleas_uid";

export type Role = "presiding_officer" | "member";

export interface DemoAccount {
  id: string;
  name: string;
  district: string;
  role: Role;
  roleLabel: string;
}

const ACCOUNT_DEFS: { id: string; role: Role; roleLabel: string }[] = [
  { id: "bm-01", role: "presiding_officer", roleLabel: "Vice Mayor · Presiding Officer" },
  { id: "bm-02", role: "member", roleLabel: "Councilor · Majority Floor Leader" },
  { id: "bm-03", role: "member", roleLabel: "Councilor" },
  { id: "bm-05", role: "member", roleLabel: "Councilor" },
];

export const DEMO_ACCOUNTS: DemoAccount[] = ACCOUNT_DEFS.map((def) => {
  const m = memberById(def.id);
  return {
    id: def.id,
    name: m?.name ?? def.id,
    district: m?.district ?? "",
    role: def.role,
    roleLabel: def.roleLabel,
  };
});

export function accountById(id: string | undefined): DemoAccount | undefined {
  if (!id) return undefined;
  return DEMO_ACCOUNTS.find((a) => a.id === id);
}

export const roleBadge = (role: Role): string =>
  role === "presiding_officer" ? "Presiding Officer" : "Member";
