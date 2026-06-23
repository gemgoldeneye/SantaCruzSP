/**
 * Santa Cruz Sanggunian core domain model.
 *
 * Mirrors the legislative workflow of a Sangguniang Bayan (municipal council).
 * NOTE: OCR/source provenance is a first-class concern (see learnings.md) — many archived
 * records originate as *scanned* physical documents, so every document carries its source,
 * OCR status, and (when applicable) OCR confidence.
 */

export type DocumentType =
  | "Ordinance"
  | "Resolution"
  | "Committee Report"
  | "Draft Resolution"
  | "Executive Order"
  | "Minutes";

/** How the document entered the system. */
export type DocumentSource = "digital" | "scanned";

/** OCR lifecycle for scanned documents. `not_applicable` for born-digital files. */
export type OcrStatus =
  | "not_applicable"
  | "pending"
  | "processing"
  | "processed"
  | "failed";

export type LegislativeCategory =
  | "Environment"
  | "Agriculture"
  | "Tourism"
  | "Budget"
  | "Health"
  | "Education"
  | "Infrastructure"
  | "Peace & Order"
  | "General";

/** Ordered stages a measure passes through before it is enacted. */
export type LegislativeStage =
  | "filed"
  | "first_reading"
  | "committee_review"
  | "second_reading"
  | "third_reading"
  | "transmitted" // to the Mayor for approval/veto
  | "approved"
  | "vetoed"
  | "enacted";

export interface BoardMember {
  id: string;
  name: string;
  /** e.g. "Santa Cruz, Zambales" or "Ex-Officio". */
  district: string;
  /** e.g. "Presiding Officer", "Councilor", "Floor Leader". */
  role: string;
}

export interface Committee {
  id: string;
  name: string; // e.g. "Committee on Appropriations"
  chairId: string; // BoardMember.id
  jurisdiction: string;
  memberIds: string[];
}

export interface LegislativeDocument {
  id: string;
  /** Human reference, e.g. "ORD-2024-015" or "RES-2023-102". */
  referenceNo: string;
  title: string;
  type: DocumentType;
  category: LegislativeCategory;
  /** Sponsor / author BoardMember ids. */
  authorIds: string[];
  year: number;
  /** ISO date the document was filed/recorded. */
  dateFiled: string;
  summary: string;

  // --- Pipeline / workflow ---
  stage: LegislativeStage;
  committeeId?: string;
  lastActionDate: string;
  nextAction?: string;

  // --- OCR / source provenance (first-class) ---
  source: DocumentSource;
  ocrStatus: OcrStatus;
  /** 0..1 confidence of the OCR pass; present when source is scanned & processed. */
  ocrConfidence?: number;
  /** Whether full-text search can read this document's contents. */
  fullTextAvailable: boolean;
  /** Full OCR-extracted text, stored for scanned uploads. */
  extractedText?: string;
  pageCount?: number;
}

export type VoteValue = "yes" | "no" | "abstain" | "absent";

export interface VoteRecord {
  documentId: string;
  stage: LegislativeStage;
  date: string;
  tally: { yes: number; no: number; abstain: number; absent: number };
}

export type AgendaItemType =
  | "Call to Order"
  | "Roll Call"
  | "Approval of Minutes"
  | "First Reading"
  | "Committee Report"
  | "Second Reading"
  | "Third Reading"
  | "Unfinished Business"
  | "Other Matters"
  | "Adjournment";

export interface AgendaItem {
  id: string;
  order: number;
  type: AgendaItemType;
  title: string;
  /** Optional link to a document being considered. */
  documentId?: string;
}

export type SessionMode = "in_person" | "virtual" | "hybrid";
export type SessionStatus = "scheduled" | "in_progress" | "adjourned";

export interface Session {
  id: string;
  title: string; // e.g. "Regular Session No. 12, Series of 2025"
  date: string;
  mode: SessionMode;
  status: SessionStatus;
  agenda: AgendaItem[];
}
