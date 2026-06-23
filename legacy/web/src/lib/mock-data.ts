/**
 * Front-end seed data for Santa Cruz Sanggunian (Sangguniang Bayan ng Santa Cruz, Zambales).
 *
 * BOARD_MEMBERS are the REAL elected officials of the 2025–2028 term — Vice Mayor (Presiding
 * Officer) and the eight (8) Sangguniang Bayan members, per the May 2025 local election results.
 * Everything else — committee assignments, documents, sessions, votes, and the Prangkisa
 * franchise records — are FICTIONAL samples for UI development only and do NOT represent actual
 * legislation, votes, or official acts of these persons. This module stands in for the future
 * backend/API; UI reads through the selectors below so the data source can be swapped cleanly later.
 *
 * Municipal Mayor (executive, not an SB member): Hon. Consolacion M. Marty.
 * Ex-officio SB seats (Liga ng mga Barangay President, SK Federation President) are omitted
 * pending confirmation of the current officeholders.
 */
import type {
  BoardMember,
  Committee,
  LegislativeDocument,
  Session,
  VoteRecord,
} from "@/types/legislation";

export const BOARD_MEMBERS: BoardMember[] = [
  { id: "bm-01", name: "Hon. Miguel M. Maniago, Jr.", district: "Santa Cruz, Zambales", role: "Presiding Officer · Vice Mayor" },
  { id: "bm-02", name: "Hon. Ian Ebido", district: "Santa Cruz, Zambales", role: "Councilor · Majority Floor Leader" },
  { id: "bm-03", name: "Hon. Maria Veronica Matibag", district: "Santa Cruz, Zambales", role: "Councilor" },
  { id: "bm-04", name: "Hon. Sarah Jane Menor", district: "Santa Cruz, Zambales", role: "Councilor" },
  { id: "bm-05", name: "Hon. Athos Maya", district: "Santa Cruz, Zambales", role: "Councilor" },
  { id: "bm-06", name: "Hon. Melvin Misa", district: "Santa Cruz, Zambales", role: "Councilor" },
  { id: "bm-07", name: "Hon. Kristan Rommel Misola", district: "Santa Cruz, Zambales", role: "Councilor" },
  { id: "bm-08", name: "Hon. Danny Merced", district: "Santa Cruz, Zambales", role: "Councilor" },
  { id: "bm-09", name: "Hon. Barbell Galicia", district: "Santa Cruz, Zambales", role: "Councilor" },
];

export const COMMITTEES: Committee[] = [
  { id: "com-approp", name: "Committee on Appropriations", chairId: "bm-02", jurisdiction: "Budget, finance, and municipal appropriations", memberIds: ["bm-02", "bm-03", "bm-05"] },
  { id: "com-pubworks", name: "Committee on Public Works & Infrastructure", chairId: "bm-05", jurisdiction: "Roads, bridges, and municipal infrastructure", memberIds: ["bm-05", "bm-07", "bm-09"] },
  { id: "com-env", name: "Committee on Environment & Natural Resources", chairId: "bm-04", jurisdiction: "Environmental protection and natural resources", memberIds: ["bm-04", "bm-03", "bm-06"] },
  { id: "com-agri", name: "Committee on Agriculture", chairId: "bm-03", jurisdiction: "Agriculture, fisheries, and food security", memberIds: ["bm-03", "bm-06", "bm-08"] },
  { id: "com-tourism", name: "Committee on Trade, Commerce & Tourism", chairId: "bm-06", jurisdiction: "Tourism, trade, and local commerce", memberIds: ["bm-06", "bm-02", "bm-07"] },
  { id: "com-health", name: "Committee on Health & Sanitation", chairId: "bm-07", jurisdiction: "Public health, hospitals, and sanitation", memberIds: ["bm-07", "bm-04", "bm-08"] },
];

export const DOCUMENTS: LegislativeDocument[] = [
  {
    id: "doc-001",
    referenceNo: "ORD-2024-015",
    title: "Municipal Single-Use Plastics Regulation Ordinance",
    type: "Ordinance",
    category: "Environment",
    authorIds: ["bm-04", "bm-03"],
    year: 2024,
    dateFiled: "2024-11-12",
    summary:
      "Regulates the distribution and use of single-use plastics across municipal offices and public markets in Santa Cruz.",
    stage: "committee_review",
    committeeId: "com-env",
    lastActionDate: "2025-05-08",
    nextAction: "Committee on Environment hearing — 2025-05-29",
    source: "digital",
    ocrStatus: "not_applicable",
    fullTextAvailable: true,
    pageCount: 9,
  },
  {
    id: "doc-002",
    referenceNo: "RES-2025-008",
    title: "Resolution Endorsing the Santa Cruz Coastal Road Project",
    type: "Resolution",
    category: "Infrastructure",
    authorIds: ["bm-05"],
    year: 2025,
    dateFiled: "2025-02-03",
    summary:
      "Endorses the proposed Santa Cruz coastal road project to the Department of Public Works and Highways.",
    stage: "second_reading",
    committeeId: "com-pubworks",
    lastActionDate: "2025-05-15",
    nextAction: "Scheduled for Second Reading — Session No. 13",
    source: "digital",
    ocrStatus: "not_applicable",
    fullTextAvailable: true,
    pageCount: 4,
  },
  {
    id: "doc-003",
    referenceNo: "ORD-1998-042",
    title: "Santa Cruz Mango Industry Development Ordinance",
    type: "Ordinance",
    category: "Agriculture",
    authorIds: ["bm-03"],
    year: 1998,
    dateFiled: "1998-07-21",
    summary:
      "Historic ordinance establishing support programs for Santa Cruz's mango industry. Digitized from physical archives.",
    stage: "enacted",
    committeeId: "com-agri",
    lastActionDate: "1998-09-15",
    source: "scanned",
    ocrStatus: "processed",
    ocrConfidence: 0.94,
    fullTextAvailable: true,
    pageCount: 12,
  },
  {
    id: "doc-004",
    referenceNo: "ORD-2003-011",
    title: "Santa Cruz Tourism Code",
    type: "Ordinance",
    category: "Tourism",
    authorIds: ["bm-06"],
    year: 2003,
    dateFiled: "2003-04-10",
    summary:
      "Codifies tourism policy, accreditation, and incentives for the municipality of Santa Cruz. Digitized from physical archives.",
    stage: "enacted",
    committeeId: "com-tourism",
    lastActionDate: "2003-06-02",
    source: "scanned",
    ocrStatus: "processed",
    ocrConfidence: 0.88,
    fullTextAvailable: true,
    pageCount: 28,
  },
  {
    id: "doc-005",
    referenceNo: "RES-2024-120",
    title: "Resolution Adopting the 2025 Municipal Annual Budget",
    type: "Resolution",
    category: "Budget",
    authorIds: ["bm-02"],
    year: 2024,
    dateFiled: "2024-12-01",
    summary:
      "Adopts the Annual Investment Program and appropriations of the Municipality of Santa Cruz for fiscal year 2025.",
    stage: "approved",
    committeeId: "com-approp",
    lastActionDate: "2024-12-20",
    source: "digital",
    ocrStatus: "not_applicable",
    fullTextAvailable: true,
    pageCount: 64,
  },
  {
    id: "doc-006",
    referenceNo: "ORD-2025-003",
    title: "Solid Waste Management Code Amendment",
    type: "Ordinance",
    category: "Environment",
    authorIds: ["bm-04"],
    year: 2025,
    dateFiled: "2025-03-18",
    summary:
      "Amends the municipal solid waste management code to add segregation incentives for barangays.",
    stage: "first_reading",
    committeeId: "com-env",
    lastActionDate: "2025-05-06",
    nextAction: "Referral to Committee on Environment",
    source: "digital",
    ocrStatus: "not_applicable",
    fullTextAvailable: true,
    pageCount: 7,
  },
  {
    id: "doc-007",
    referenceNo: "CR-2025-014",
    title: "Committee Report on the Proposed Agri-Fishery Support Program",
    type: "Committee Report",
    category: "Agriculture",
    authorIds: ["bm-03"],
    year: 2025,
    dateFiled: "2025-04-22",
    summary:
      "Committee on Agriculture report recommending approval of the agri-fishery support program.",
    stage: "committee_review",
    committeeId: "com-agri",
    lastActionDate: "2025-05-12",
    nextAction: "Report to the plenary — Session No. 13",
    source: "digital",
    ocrStatus: "not_applicable",
    fullTextAvailable: true,
    pageCount: 15,
  },
  {
    id: "doc-008",
    referenceNo: "ORD-1995-007",
    title: "Anti-Illegal Logging Ordinance",
    type: "Ordinance",
    category: "Environment",
    authorIds: ["bm-04"],
    year: 1995,
    dateFiled: "1995-02-14",
    summary:
      "Historical ordinance penalizing illegal logging in Santa Cruz's upland watersheds. Scan quality is poor; OCR could not extract reliable text.",
    stage: "enacted",
    committeeId: "com-env",
    lastActionDate: "1995-03-30",
    source: "scanned",
    ocrStatus: "failed",
    fullTextAvailable: false,
    pageCount: 6,
  },
  {
    id: "doc-009",
    referenceNo: "RES-2025-031",
    title: "Resolution Requesting DPWH Action on Barangay Tabalong Flood Control",
    type: "Resolution",
    category: "Infrastructure",
    authorIds: ["bm-07", "bm-05"],
    year: 2025,
    dateFiled: "2025-05-19",
    summary:
      "Requests urgent flood-control intervention for Barangay Tabalong, Santa Cruz.",
    stage: "filed",
    lastActionDate: "2025-05-19",
    nextAction: "Calendar for First Reading",
    source: "digital",
    ocrStatus: "not_applicable",
    fullTextAvailable: true,
    pageCount: 3,
  },
  {
    id: "doc-010",
    referenceNo: "ORD-2010-022",
    title: "Municipal Investment Incentives Code",
    type: "Ordinance",
    category: "Budget",
    authorIds: ["bm-02", "bm-06"],
    year: 2010,
    dateFiled: "2010-08-09",
    summary:
      "Establishes tax and fee incentives for qualified investments in Santa Cruz. Currently being digitized from physical archives.",
    stage: "enacted",
    committeeId: "com-approp",
    lastActionDate: "2010-10-01",
    source: "scanned",
    ocrStatus: "processing",
    fullTextAvailable: false,
    pageCount: 22,
  },
  {
    id: "doc-011",
    referenceNo: "EO-2025-002",
    title: "Executive Order on Municipal Disaster Preparedness",
    type: "Executive Order",
    category: "Peace & Order",
    authorIds: ["bm-01"],
    year: 2025,
    dateFiled: "2025-01-15",
    summary:
      "Directs the activation of municipal disaster-preparedness protocols ahead of the rainy season.",
    stage: "approved",
    lastActionDate: "2025-01-20",
    source: "digital",
    ocrStatus: "not_applicable",
    fullTextAvailable: true,
    pageCount: 5,
  },
  {
    id: "doc-012",
    referenceNo: "ORD-2024-009",
    title: "Watershed Protection Ordinance for the Santa Cruz River Watershed",
    type: "Ordinance",
    category: "Environment",
    authorIds: ["bm-04", "bm-06"],
    year: 2024,
    dateFiled: "2024-09-02",
    summary:
      "Designates protection zones and penalties for the Santa Cruz River watershed.",
    stage: "third_reading",
    committeeId: "com-env",
    lastActionDate: "2025-05-14",
    nextAction: "Scheduled for Third Reading — Session No. 13",
    source: "digital",
    ocrStatus: "not_applicable",
    fullTextAvailable: true,
    pageCount: 11,
  },
];

export const VOTE_RECORDS: VoteRecord[] = [
  { documentId: "doc-005", stage: "approved", date: "2024-12-20", tally: { yes: 7, no: 0, abstain: 1, absent: 0 } },
  { documentId: "doc-002", stage: "first_reading", date: "2025-03-04", tally: { yes: 6, no: 1, abstain: 1, absent: 0 } },
  { documentId: "doc-012", stage: "second_reading", date: "2025-05-14", tally: { yes: 8, no: 0, abstain: 0, absent: 0 } },
  { documentId: "doc-011", stage: "approved", date: "2025-01-20", tally: { yes: 8, no: 0, abstain: 0, absent: 0 } },
];

export const SESSIONS: Session[] = [
  {
    id: "ses-12",
    title: "Regular Session No. 12, Series of 2025",
    date: "2025-05-20",
    mode: "hybrid",
    status: "adjourned",
    agenda: [
      { id: "a-12-1", order: 1, type: "Call to Order", title: "Call to order by the Presiding Officer" },
      { id: "a-12-2", order: 2, type: "Roll Call", title: "Roll call of members" },
      { id: "a-12-3", order: 3, type: "Approval of Minutes", title: "Approval of minutes of Session No. 11" },
      { id: "a-12-4", order: 4, type: "Committee Report", title: "Report on the Agri-Fishery Support Program", documentId: "doc-007" },
      { id: "a-12-5", order: 5, type: "First Reading", title: "Solid Waste Management Code Amendment", documentId: "doc-006" },
      { id: "a-12-6", order: 6, type: "Adjournment", title: "Adjournment" },
    ],
  },
  {
    id: "ses-13",
    title: "Regular Session No. 13, Series of 2025",
    date: "2025-05-27",
    mode: "hybrid",
    status: "scheduled",
    agenda: [
      { id: "a-13-1", order: 1, type: "Call to Order", title: "Call to order by the Presiding Officer" },
      { id: "a-13-2", order: 2, type: "Roll Call", title: "Roll call of members" },
      { id: "a-13-3", order: 3, type: "Second Reading", title: "Resolution Endorsing the Santa Cruz Coastal Road Project", documentId: "doc-002" },
      { id: "a-13-4", order: 4, type: "Third Reading", title: "Watershed Protection Ordinance for the Santa Cruz River Watershed", documentId: "doc-012" },
      { id: "a-13-5", order: 5, type: "Committee Report", title: "Report on the Agri-Fishery Support Program", documentId: "doc-007" },
      { id: "a-13-6", order: 6, type: "Other Matters", title: "Other matters" },
      { id: "a-13-7", order: 7, type: "Adjournment", title: "Adjournment" },
    ],
  },
];

// --- Selectors (the seam a real API would replace) ---

const memberIndex = new Map(BOARD_MEMBERS.map((m) => [m.id, m]));
const committeeIndex = new Map(COMMITTEES.map((c) => [c.id, c]));
const documentIndex = new Map(DOCUMENTS.map((d) => [d.id, d]));

export const memberById = (id: string): BoardMember | undefined => memberIndex.get(id);
export const committeeById = (id: string): Committee | undefined => committeeIndex.get(id);
export const documentById = (id: string): LegislativeDocument | undefined => documentIndex.get(id);

export const authorsOf = (doc: LegislativeDocument): BoardMember[] =>
  doc.authorIds.map(memberById).filter((m): m is BoardMember => Boolean(m));

export const authorNames = (doc: LegislativeDocument): string =>
  authorsOf(doc).map((m) => m.name).join(", ") || "—";
