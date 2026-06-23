/**
 * Permission catalog — the pages and functionalities a role can be granted.
 *
 * Client-safe (constants + pure helpers only). Roles store an array of these
 * permission keys; the session carries the signed-in user's resolved set.
 *
 * The Executive Dashboard ("/") is the always-available home and is not gated,
 * so every signed-in user lands somewhere even with a minimal role.
 */

/** Page-access permissions. `href` mirrors the nav item the permission unlocks. */
export const PAGE_PERMISSIONS = [
  { key: "page:search", label: "Smart Search & E-Library", href: "/search" },
  { key: "page:scan", label: "Scan & Digitize", href: "/scan" },
  { key: "page:sessions", label: "Paperless Sessions", href: "/sessions" },
  { key: "page:tracking", label: "Legislative Tracking", href: "/tracking" },
  { key: "page:prangkisa", label: "Tricycle Franchising (MTOP)", href: "/prangkisa" },
  { key: "page:analytics", label: "Data Analytics & Reports", href: "/analytics" },
  { key: "page:accounts", label: "Accounts", href: "/accounts" },
  { key: "page:roles", label: "Roles", href: "/roles" },
  { key: "page:logs", label: "Activity Logs", href: "/logs" },
] as const;

/** Functionality permissions enforced on specific actions. */
export const FEATURE_PERMISSIONS = [
  { key: "documents:create", label: "Scan / upload documents" },
  { key: "sessions:manage", label: "Manage sessions (create, edit, delete)" },
  { key: "accounts:manage", label: "Manage accounts (create, edit, delete)" },
  { key: "roles:manage", label: "Manage roles (create, edit, delete)" },
] as const;

export const ALL_PERMISSIONS = [
  ...PAGE_PERMISSIONS,
  ...FEATURE_PERMISSIONS,
] as const;

export type PermissionKey = (typeof ALL_PERMISSIONS)[number]["key"];

/** Every permission key (used to grant "full access" roles). */
export const ALL_PERMISSION_KEYS: string[] = ALL_PERMISSIONS.map((p) => p.key);

/** Does this permission set include the given key? */
export function can(
  permissions: string[] | undefined | null,
  key: string,
): boolean {
  return Array.isArray(permissions) && permissions.includes(key);
}

/**
 * The page permission that gates a nav href, or null when the route is always
 * accessible (the dashboard) or not page-gated.
 */
export function pagePermissionForHref(href: string): string | null {
  return PAGE_PERMISSIONS.find((p) => p.href === href)?.key ?? null;
}
