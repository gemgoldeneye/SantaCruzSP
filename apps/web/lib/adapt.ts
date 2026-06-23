// Mappers between the @gelabs/sp/contracts collection shapes and the legacy domain types
// the ported presentational components expect. Keeps `ref` (the platform field)
// canonical while feeding the legacy components their `referenceNo`-style props.
import type {
  AgendaItem, AgendaItemType, DocumentType, LegislativeCategory, LegislativeDocument,
  LegislativeStage, Session, SessionMode, SessionStatus, VoteRecord,
} from '../types/legislation';
import type { SpDocument, SpSession } from '../data';

export function toLegacyDoc(d: SpDocument): LegislativeDocument {
  return {
    id: d.id,
    referenceNo: d.ref,
    title: d.title,
    type: d.type as DocumentType,
    category: d.category as LegislativeCategory,
    authorIds: d.authors,
    year: d.year,
    dateFiled: d.dateFiled,
    summary: d.summary,
    stage: d.stage as LegislativeStage,
    ...(d.committeeId ? { committeeId: d.committeeId } : {}),
    lastActionDate: d.lastActionDate ?? d.dateFiled,
    ...(d.nextAction ? { nextAction: d.nextAction } : {}),
    source: d.source,
    ocrStatus: d.ocrStatus,
    ...(d.ocrConfidence != null ? { ocrConfidence: d.ocrConfidence } : {}),
    fullTextAvailable: d.fullTextAvailable,
    ...(d.extractedText ? { extractedText: d.extractedText } : {}),
    ...(d.pageCount != null ? { pageCount: d.pageCount } : {}),
  };
}

export function toLegacySession(s: SpSession, docByRef: Map<string, SpDocument>): Session {
  return {
    id: s.id,
    title: s.title,
    date: s.date,
    mode: s.mode as SessionMode,
    status: s.status as SessionStatus,
    agenda: s.agenda.map((a): AgendaItem => {
      const doc = a.documentRef ? docByRef.get(a.documentRef) : undefined;
      return { id: a.id, order: a.order, type: a.type as AgendaItemType, title: a.title, ...(doc ? { documentId: doc.id } : {}) };
    }),
  };
}

/** Flatten the keyed `votes` of every document into legacy VoteRecord rows. */
export function toVoteRecords(docs: SpDocument[]): VoteRecord[] {
  const out: VoteRecord[] = [];
  for (const d of docs) {
    for (const [stage, v] of Object.entries(d.votes ?? {})) {
      out.push({ documentId: d.id, stage: stage as LegislativeStage, date: v.date ?? d.lastActionDate ?? d.dateFiled, tally: { yes: v.yes, no: v.no, abstain: v.abstain, absent: v.absent ?? 0 } });
    }
  }
  return out;
}
