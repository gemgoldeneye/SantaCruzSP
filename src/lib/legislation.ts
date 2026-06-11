/**
 * Presentation helpers for the legislative domain: stage ordering/labels,
 * OCR status display, and small formatters used across modules.
 */
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

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatConfidence(value?: number): string {
  if (value === undefined) return "—";
  return `${Math.round(value * 100)}%`;
}

/**
 * The document's full "filed" text. Returns the real OCR/saved text when present
 * (scanned uploads); otherwise builds a representative legislative body from the
 * record's own fields so every document has readable content on its detail page.
 */
export function documentBody(doc: LegislativeDocument): string {
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
    "Republic of the Philippines",
    "Province of Zambales · Municipality of Santa Cruz",
    "SANGGUNIANG BAYAN",
    "",
    `${heading} No. ${doc.referenceNo}, Series of ${doc.year}`,
    "",
    `A ${doc.type.toUpperCase()} ENTITLED "${doc.title.toUpperCase()}"`,
    "",
    `WHEREAS, the Sangguniang Bayan ng Santa Cruz recognizes the need to act on matters concerning ${doc.category.toLowerCase()} for the welfare of the residents of Santa Cruz, Zambales;`,
    "",
    `WHEREAS, ${doc.summary}`,
    "",
    `NOW, THEREFORE, be it ${verb} by the Sangguniang Bayan ng Santa Cruz in session duly assembled, that this measure is hereby adopted and shall take effect upon approval.`,
    "",
    `Filed: ${formatDate(doc.dateFiled)}.  Current status: ${STAGE_META[doc.stage].label}.`,
  ].join("\n");
}
