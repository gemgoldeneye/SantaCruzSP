// Maps the legacy page/feature permission catalog onto the platform RBAC the API
// enforces (roleKey + offices + memberships), so a custom role grant drives real
// office access. Extracted from the admin routes so the smoke test can lock the
// mapping down without a DB.
export interface Membership { office: string; officeRole: string }
export interface DerivedRbac { roleKey: string; offices: string[]; memberships: Membership[] }

/** Permissions that, when granted, let a role create/edit/delete in the Sanggunian
 *  office (sessions, documents) — they derive an `encoder` membership. */
const SANGGUNIAN_ENCODE = ['documents:create', 'sessions:manage'];

/** Any of these page/feature permissions opens the Sanggunian office at all. */
const SANGGUNIAN_PAGES = ['page:sessions', 'page:tracking', 'page:scan', 'page:search', 'sessions:manage'];

export function deriveRbac(perms: string[]): DerivedRbac {
  if (perms.includes('accounts:manage') || perms.includes('roles:manage')) {
    return { roleKey: 'lgu_admin', offices: ['*'], memberships: [] };
  }
  const canEncodeSanggunian = SANGGUNIAN_ENCODE.some((p) => perms.includes(p));
  const canEncodeMtop = perms.includes('documents:create');
  const m: Membership[] = [];
  if (SANGGUNIAN_PAGES.some((p) => perms.includes(p))) {
    m.push({ office: 'sanggunian', officeRole: canEncodeSanggunian ? 'encoder' : 'viewer' });
  }
  if (perms.includes('page:prangkisa')) m.push({ office: 'mtop', officeRole: canEncodeMtop ? 'encoder' : 'viewer' });
  return { roleKey: 'operator', offices: [], memberships: m };
}
