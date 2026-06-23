// Reference-data lookups for the legacy components — backed by the live
// @gelabs/sp/sync-client collections (members/committees) instead of the old static
// arrays. bootSync() runs before render, so .all() is populated at call-time.
import type { BoardMember, Committee, LegislativeDocument } from '../types/legislation';
import { members, committees } from '../data';

export function memberById(id: string): BoardMember | undefined {
  const m = members.all().find((x) => x.id === id);
  return m ? { id: m.id, name: m.name, district: m.district ?? '', role: m.role } : undefined;
}

export function committeeById(id: string): Committee | undefined {
  const c = committees.all().find((x) => x.id === id);
  if (!c) return undefined;
  return { id: c.id, name: c.name, chairId: c.chairId ?? '', jurisdiction: c.jurisdiction, memberIds: c.roster.map((r) => r.boardMemberId) };
}

export function allCommittees(): Committee[] {
  return committees.all().map((c) => ({ id: c.id, name: c.name, chairId: c.chairId ?? '', jurisdiction: c.jurisdiction, memberIds: c.roster.map((r) => r.boardMemberId) }));
}

export const authorsOf = (doc: LegislativeDocument): BoardMember[] =>
  doc.authorIds.map((id) => memberById(id)).filter(Boolean) as BoardMember[];

export const authorNames = (doc: LegislativeDocument): string =>
  authorsOf(doc).map((m) => m.name).join(', ') || '—';
