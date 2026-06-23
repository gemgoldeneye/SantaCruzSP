// Reactive hooks that expose the @gelabs/sp/sync-client collections in the legacy domain
// shape, so the ported presentational components render unchanged.
import { useMemo } from 'react';
import { documents, sessions, type SpDocument } from '../data';
import { toLegacyDoc, toLegacySession, toVoteRecords } from '../lib/adapt';
import type { LegislativeDocument, Session, VoteRecord } from '../types/legislation';

export function useLegacyDocuments(): LegislativeDocument[] {
  const docs = documents.useItems();
  return useMemo(() => docs.map(toLegacyDoc), [docs]);
}

export function useLegacyVotes(): VoteRecord[] {
  const docs = documents.useItems();
  return useMemo(() => toVoteRecords(docs), [docs]);
}

export function useLegacySessions(): Session[] {
  const sess = sessions.useItems();
  const docs = documents.useItems();
  return useMemo(() => {
    const byRef = new Map<string, SpDocument>(docs.map((d) => [d.ref, d]));
    return sess.map((s) => toLegacySession(s, byRef));
  }, [sess, docs]);
}
