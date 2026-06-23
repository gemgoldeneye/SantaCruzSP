/**
 * Presentation helpers for the legislative domain: stage ordering/labels,
 * OCR status display, and small formatters used across modules.
 */
import { formatDate } from "@gelabs/sp/core";
import type {
  LegislativeStage,
  OcrStatus,
  DocumentSource,
  LegislativeDocument,
} from "@/types/legislation";

/** Canonical order of the pipeline (excludes the terminal `vetoed` branch). */
export const STAGE_ORDER: LegislativeStage[] = [
  "filed",
  "first_reading",
  "committee_review",
  "second_reading",
  "third_reading",
  "transmitted",
  "approved",
  "enacted",
];

type BadgeTone = "default" | "secondary" | "outline" | "destructive";

export const STAGE_META: Record<
  LegislativeStage,
  { label: string; short: string; tone: BadgeTone }
> = {
  filed: { label: "Filed", short: "Filed", tone: "outline" },
  first_reading: { label: "First Reading", short: "1st Reading", tone: "secondary" },
  committee_review: { label: "Committee Review", short: "Committee", tone: "secondary" },
  second_reading: { label: "Second Reading", short: "2nd Reading", tone: "secondary" },
  third_reading: { label: "Third Reading", short: "3rd Reading", tone: "secondary" },
  transmitted: { label: "Transmitted to Mayor", short: "Transmitted", tone: "default" },
  approved: { label: "Approved", short: "Approved", tone: "default" },
  vetoed: { label: "Vetoed", short: "Vetoed", tone: "destructive" },
  enacted: { label: "Enacted", short: "Enacted", tone: "default" },
};

/** Active (still in-progress) stages — drives what the Tracking board shows. */
export const ACTIVE_STAGES: LegislativeStage[] = [
  "filed",
  "first_reading",
  "committee_review",
  "second_reading",
  "third_reading",
  "transmitted",
];

export function isActiveStage(stage: LegislativeStage): boolean {
  return ACTIVE_STAGES.includes(stage);
}

/**
 * The legal next stage(s) a measure may move to. The pipeline is mostly linear,
 * except `transmitted` (the Mayor's desk) branches to either `approved` or
 * `vetoed`. Terminal stages (`enacted`, `vetoed`) have no successor.
 */
export function nextStages(stage: LegislativeStage): LegislativeStage[] {
  if (stage === "transmitted") return ["approved", "vetoed"];
  if (stage === "enacted" || stage === "vetoed") return [];
  const idx = STAGE_ORDER.indexOf(stage);
  return idx >= 0 && idx < STAGE_ORDER.length - 1 ? [STAGE_ORDER[idx + 1]] : [];
}

export const OCR_META: Record<
  OcrStatus,
  { label: string; tone: BadgeTone }
> = {
  not_applicable: { label: "Born-digital", tone: "outline" },
  pending: { label: "OCR pending", tone: "secondary" },
  processing: { label: "OCR processing", tone: "secondary" },
  processed: { label: "OCR processed", tone: "default" },
  failed: { label: "OCR failed", tone: "destructive" },
};

export const SOURCE_LABEL: Record<DocumentSource, string> = {
  digital: "Digital upload",
  scanned: "Scanned record",
};

// Re-exported from @gelabs/sp/core so existing `@/lib/legislation` imports resolve.
export { formatDate };

export function formatConfidence(value?: number): string {
  if (value === undefined) return "—";
  return `${Math.round(value * 100)}%`;
}

/** Per-LGU identity threaded into generated legislative text (from the active config). */
export interface DocumentBodyIdentity {
  /** e.g. "Republic of the Philippines". */
  country: string;
  /** Province name, printed as "Province of {province}", e.g. "Zambales". */
  province: string;
  /** e.g. "Municipality of Santa Cruz". */
  municipality: string;
  /** The legislative body's formal name, e.g. "Sangguniang Bayan ng Santa Cruz". */
  council: string;
  /** Locale phrase for "the residents of …", e.g. "Santa Cruz, Zambales". */
  locale: string;
}

/**
 * The document's full "filed" text. Returns the real OCR/saved text when present
 * (scanned uploads); otherwise builds a representative legislative body from the
 * record's own fields so every document has readable content on its detail page.
 * Municipality identity is supplied by the caller from the active LGU config.
 */
export function documentBody(doc: LegislativeDocument, id: DocumentBodyIdentity): string {
  if (doc.extractedText) return doc.extractedText;
  const heading =
    doc.type === "Resolution"
      ? "RESOLUTION"
      : doc.type === "Executive Order"
        ? "EXECUTIVE ORDER"
        : doc.type === "Committee Report"
          ? "COMMITTEE REPORT"
          : "ORDINANCE";
  const verb = doc.type === "Resolution" ? "RESOLVED" : "ORDAINED";
  return [
    id.country,
    `Province of ${id.province} · ${id.municipality}`,
    "SANGGUNIANG BAYAN",
    "",
    `${heading} No. ${doc.referenceNo}, Series of ${doc.year}`,
    "",
    `A ${doc.type.toUpperCase()} ENTITLED "${doc.title.toUpperCase()}"`,
    "",
    `WHEREAS, the ${id.council} recognizes the need to act on matters concerning ${doc.category.toLowerCase()} for the welfare of the residents of ${id.locale};`,
    "",
    `WHEREAS, ${doc.summary}`,
    "",
    `NOW, THEREFORE, be it ${verb} by the ${id.council} in session duly assembled, that this measure is hereby adopted and shall take effect upon approval.`,
    "",
    `Filed: ${formatDate(doc.dateFiled)}.  Current status: ${STAGE_META[doc.stage].label}.`,
  ].join("\n");
}
