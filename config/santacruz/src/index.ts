/**
 * Per-LGU config INSTANCE for the Municipality of Santa Cruz, Zambales.
 *
 * Single source of truth for everything municipality-specific in the Santa Cruz
 * deployment. Validated against the SDK contract (`@gelabs/sp/config`) at load.
 * To stand up another LGU: copy this package, change the values, point the apps
 * at it. No SDK code is forked.
 */
import { defineSpConfig } from '@gelabs/sp/config';

export const santaCruzConfig = defineSpConfig({
  municipality: {
    name: 'Municipality of Santa Cruz',
    province: 'Zambales',
    fullName: 'Municipality of Santa Cruz, Zambales',
    shortName: 'Santa Cruz',
    sealSrc: '/santa-cruz-seal.png',
    faviconSrc: '/santa-cruz-seal.png',
    tagline: {
      fil: 'E-Archive at Sesyon ng Batas',
      en: 'Legislative E-Archive & Session',
    },
    country: 'Republic of the Philippines',
    region: 'Region III (Central Luzon)',
  },

  tenant: {
    tenantId: 'santacruz-zambales',
    provinceTenant: 'zambales-province',
    emailDomain: 'santacruz.gov.ph',
    devCitizenOtp: '123456',
  },

  theme: {
    fontSans: 'Geist',
    fontMono: 'Geist Mono',
    primary: 'oklch(0.42 0.14 255)',
    primaryDark: 'oklch(0.72 0.13 255)',
    headerBg: '#0e1b34',
    sidebarBg: '#b51d2b',
    accent: '#caa14a',
  },

  apps: {
    staff: {
      title: 'Santa Cruz Sanggunian — Staff',
      name: 'Santa Cruz Sanggunian — Staff',
      shortName: 'SB Santa Cruz',
      description: 'Sangguniang Bayan ng Santa Cruz — legislative archive, sessions, franchising',
      themeColor: '#0e1b34',
      backgroundColor: '#ffffff',
    },
    portal: {
      title: 'Santa Cruz · Sanggunian Portal',
      name: 'Santa Cruz · Sanggunian Portal',
      shortName: 'Santa Cruz Portal',
      description: 'Transparency, verification, at feedback — Bayan ng Santa Cruz, Zambales',
      themeColor: '#ffffff',
      backgroundColor: '#ffffff',
    },
  },

  offices: [
    { key: 'sanggunian', label: { fil: 'Sangguniang Bayan', en: 'Sangguniang Bayan' }, icon: 'ti-gavel', route: '/sessions', group: 'legislative', phase: 'P1', status: 'live' },
    { key: 'mtop', label: { fil: 'Prangkisa (MTOP)', en: 'Franchising (MTOP)' }, icon: 'ti-motorbike', route: '/prangkisa', group: 'permits', phase: 'P1', status: 'live' },
    { key: 'treasury', label: { fil: 'Ingat-Yaman', en: 'Treasury' }, icon: 'ti-cash', route: '/treasury', group: 'revenue', phase: 'P1', status: 'live' },
    { key: 'mayor_office', label: { fil: 'Tanggapan ng Alkalde', en: "Mayor's Office" }, icon: 'ti-building', route: '/mayor', group: 'executive', phase: 'P1', status: 'shell' },
    { key: 'portal', label: { fil: 'Portal ng Mamamayan', en: 'Citizen Portal' }, icon: 'ti-users', route: '/portal', group: 'portal', phase: 'P1', status: 'live' },
  ],

  modules: {
    sanggunian: {
      enabled: true,
      refPrefix: 'SB',
      // Sangguniang Bayan roster (2025–2028) — seeded into sp.sanggunian.members.
      members: [
        { id: 'bm-01', name: 'Hon. Miguel M. Maniago, Jr.', district: 'Presiding', role: 'Presiding Officer' },
        { id: 'bm-02', name: 'Hon. Ian Ebido', district: 'Majority Floor Leader', role: 'Member' },
        { id: 'bm-03', name: 'Hon. Maria Veronica Matibag', district: 'Member', role: 'Member' },
        { id: 'bm-04', name: 'Hon. Sarah Jane Menor', district: 'Member', role: 'Member' },
        { id: 'bm-05', name: 'Hon. Athos Maya', district: 'Member', role: 'Member' },
        { id: 'bm-06', name: 'Hon. Melvin Misa', district: 'Member', role: 'Member' },
        { id: 'bm-07', name: 'Hon. Kristan Rommel Misola', district: 'Member', role: 'Member' },
        { id: 'bm-08', name: 'Hon. Danny Merced', district: 'Member', role: 'Member' },
        { id: 'bm-09', name: 'Hon. Barbell Galicia', district: 'Member', role: 'Member' },
      ],
      // Standing committees — seeded into sp.sanggunian.bodies.
      committees: [
        { id: 'cmte-approp', name: 'Committee on Appropriations', jurisdiction: 'Budget & finance', chairId: 'bm-02', roster: [{ boardMemberId: 'bm-02' }, { boardMemberId: 'bm-03' }] },
        { id: 'cmte-works', name: 'Committee on Public Works & Infrastructure', jurisdiction: 'Infrastructure', chairId: 'bm-05', roster: [{ boardMemberId: 'bm-05' }] },
        { id: 'cmte-environment', name: 'Committee on Environment & Natural Resources', jurisdiction: 'Environment', chairId: 'bm-04', roster: [{ boardMemberId: 'bm-04' }] },
        { id: 'cmte-agri', name: 'Committee on Agriculture', jurisdiction: 'Agriculture', chairId: 'bm-03', roster: [{ boardMemberId: 'bm-03' }] },
        { id: 'cmte-trade', name: 'Committee on Trade, Commerce & Tourism', jurisdiction: 'Trade & tourism', chairId: 'bm-06', roster: [{ boardMemberId: 'bm-06' }] },
        { id: 'cmte-health', name: 'Committee on Health & Sanitation', jurisdiction: 'Health', chairId: 'bm-07', roster: [{ boardMemberId: 'bm-07' }] },
      ],
      // Representative legislative documents (DEMO seed) — into sp.sanggunian.documents.
      sampleDocuments: [
        {
          id: 'doc-1', ref: 'ORD-2024-015', title: 'Municipal Single-Use Plastics Regulation Ordinance',
          type: 'Ordinance', category: 'Environment', year: 2024, dateFiled: '2024-05-14',
          summary: 'An ordinance regulating single-use plastics in the Municipality of Santa Cruz.',
          stage: 'enacted', committeeId: 'cmte-environment', authors: ['bm-04'],
          source: 'digital', ocrStatus: 'not_applicable', fullTextAvailable: true,
          votes: { third_reading: { yes: 8, no: 0, abstain: 1, absent: 0, date: '2024-06-18' } },
          wf: { def: 'legislation', current: 8 },
        },
        {
          id: 'doc-2', ref: 'RES-2025-008', title: 'Resolution Endorsing the Santa Cruz Coastal Road Project',
          type: 'Resolution', category: 'Infrastructure', year: 2025, dateFiled: '2025-02-11',
          summary: 'A resolution endorsing the Santa Cruz coastal road improvement project.',
          stage: 'committee_review', committeeId: 'cmte-works', authors: ['bm-05'],
          source: 'scanned', ocrStatus: 'processed', ocrConfidence: 0.94, pageCount: 6, fullTextAvailable: true,
          extractedText: 'WHEREAS, the Sangguniang Bayan recognizes the need to improve coastal connectivity…',
          wf: { def: 'legislation', current: 2 },
        },
      ],
      // Representative session (DEMO seed) — into sp.sanggunian.sessions.
      sampleSessions: [
        {
          id: 'sess-1', title: 'Regular Session No. 12, Series of 2025', date: '2025-05-20', mode: 'hybrid', status: 'adjourned',
          agenda: [
            { id: 'ag-1', order: 1, type: 'ordinance', title: 'Third reading — Single-Use Plastics Ordinance', documentRef: 'ORD-2024-015' },
            { id: 'ag-2', order: 2, type: 'resolution', title: 'Committee report — Coastal Road Project', documentRef: 'RES-2025-008' },
          ],
        },
      ],
    },
    mtop: {
      enabled: true,
      applicationPrefix: 'APP',
      franchisePrefix: 'STC',
      mtopPrefix: 'MTOP-STC',
      // Franchise zones (Santa Cruz barangays) — seeded into sp.mtop.zones.
      zones: [
        { id: 'zone-pn', name: 'Poblacion North', kind: 'Poblacion', cap: 120, used: 118, frozen: false },
        { id: 'zone-ps', name: 'Poblacion South', kind: 'Poblacion', cap: 120, used: 96, frozen: false },
        { id: 'zone-b1', name: 'Lucapon North', kind: 'Rural', cap: 90, used: 71, frozen: false },
        { id: 'zone-b2', name: 'Lucapon South', kind: 'Rural', cap: 80, used: 62, frozen: false },
        { id: 'zone-b3', name: 'Guisguis', kind: 'Rural', cap: 70, used: 40, frozen: false },
        { id: 'zone-b4', name: 'Tabalong', kind: 'Rural', cap: 70, used: 70, frozen: true },
        { id: 'zone-b5', name: 'Bayto', kind: 'Rural', cap: 60, used: 33, frozen: false },
        { id: 'zone-b6', name: 'Sabang', kind: 'Rural', cap: 60, used: 29, frozen: false },
        { id: 'zone-b7', name: 'Gama', kind: 'Rural', cap: 60, used: 22, frozen: false },
        { id: 'zone-b8', name: 'San Fernando', kind: 'Rural', cap: 60, used: 25, frozen: false },
        { id: 'zone-b9', name: 'Pamonoran', kind: 'Rural', cap: 50, used: 18, frozen: false },
        { id: 'zone-b10', name: 'Bangcol', kind: 'Rural', cap: 50, used: 31, frozen: false },
        { id: 'zone-b11', name: 'Babuyan', kind: 'Rural', cap: 50, used: 27, frozen: false },
        { id: 'zone-b12', name: 'Naulo', kind: 'Rural', cap: 50, used: 19, frozen: false },
      ],
      // Tricycle operators' associations — seeded into sp.mtop.todas.
      todas: [
        { id: 'toda-market', name: 'Santa Cruz Public Market TODA' },
        { id: 'toda-poblacion', name: 'Poblacion TODA' },
        { id: 'toda-lucapon', name: 'Lucapon TODA' },
        { id: 'toda-tabalong', name: 'Tabalong TODA' },
        { id: 'toda-guisguis', name: 'Guisguis–Bayto TODA' },
        { id: 'toda-sanfernando', name: 'San Fernando TODA' },
      ],
    },
    treasury: {
      enabled: true,
      orderPrefix: 'OP',
      // MTOP fee schedule — all-in totals per application type (seeded into sp.treasury.fees).
      fees: [
        { id: 'fee-new', appType: 'NEW_MTOP', label: 'New MTOP', amount: 1870, confirmed: true, sortOrder: 1 },
        { id: 'fee-renew', appType: 'RENEWAL', label: 'Renewal', amount: 1550, confirmed: true, sortOrder: 2 },
        { id: 'fee-motor', appType: 'CHANGE_MOTOR', label: 'Change of Motor', amount: 770, confirmed: true, sortOrder: 3 },
        { id: 'fee-drop', appType: 'DROPPING', label: 'Dropping', amount: 250, confirmed: true, sortOrder: 4 },
      ],
    },
    portal: {
      enabled: true,
      refPrefix: 'FB',
      // Public projects shown on the citizen portal — seeded into sp.portal.projects.
      projects: [
        { id: 'proj-1', name: 'Santa Cruz Coastal Road Improvement', municipality: 'Santa Cruz', status: 'Ongoing', budget: 52000000, sortOrder: 1 },
        { id: 'proj-2', name: 'Public Market Modernization', municipality: 'Santa Cruz', status: 'Planned', budget: 38000000, sortOrder: 2 },
        { id: 'proj-3', name: 'Mango Industry Development Program', municipality: 'Santa Cruz', status: 'Ongoing', budget: 12000000, sortOrder: 3 },
      ],
    },
  },

  payment: {
    provider: 'lgu_pay',
    methods: [
      { id: 'gcash', label: 'GCash', blurb: 'Pay instantly with your GCash wallet.' },
      { id: 'maya', label: 'Maya', blurb: 'Pay using your Maya account.' },
      { id: 'card', label: 'Card', blurb: 'Pay with a debit or credit card.' },
      { id: 'bank', label: 'Bank transfer', blurb: 'Online bank transfer.' },
    ],
  },

  defaultLang: 'en',

  copy: {
    portalHeader: { fil: 'Portal ng Sanggunian ng Santa Cruz', en: 'Santa Cruz Sanggunian Portal' },
    portalFooter: {
      fil: 'Sanggunian ng Santa Cruz · Bayan ng Santa Cruz, Zambales',
      en: 'Santa Cruz Sanggunian · Municipality of Santa Cruz, Zambales',
    },
    heroTitle: {
      fil: 'Portal ng Transparency ng Batas — Santa Cruz',
      en: 'Santa Cruz Legislative Transparency Portal',
    },
    heroBlurb: {
      fil: 'Tingnan ang mga naisabatas na ordinansa at resolusyon, subaybayan ang mga proyekto ng bayan, at magpadala ng puna sa Sangguniang Bayan ng Santa Cruz.',
      en: 'Access approved municipal ordinances and resolutions, track public projects, and share your feedback with the Sangguniang Bayan ng Santa Cruz.',
    },
    feedbackNote: {
      fil: 'Susuriin ito ng Sekretariat ng Sangguniang Bayan.',
      en: 'The Sangguniang Bayan Secretariat will review it.',
    },
    councilName: { fil: 'Sangguniang Bayan ng Santa Cruz', en: 'Sangguniang Bayan ng Santa Cruz' },
    staffLoginSubtitle: {
      fil: 'Santa Cruz Legislative E-Archive & Session · Lalawigan ng Zambales',
      en: 'Santa Cruz Legislative E-Archive & Session · Lalawigan ng Zambales',
    },
    revenueOrdinance: { fil: 'Santa Cruz Revenue Ordinance', en: 'Santa Cruz Revenue Ordinance' },
    revenueCodeName: { fil: 'Santa Cruz Revised Revenue Code', en: 'Santa Cruz Revised Revenue Code' },
  },

  // Dev/demo logins — NOT for production.
  demoAccounts: [
    { email: 'admin@santacruz.gov.ph', name: 'System Administrator', role: 'lgu_admin', password: 'demo1234', initials: 'AD' },
    { email: 'miguel.maniago@santacruz.gov.ph', name: 'Miguel Maniago Jr.', role: 'presiding_officer', password: 'demo1234', initials: 'MM' },
    { email: 'ian.ebido@santacruz.gov.ph', name: 'Ian Ebido', role: 'member', password: 'demo1234', initials: 'IE' },
    { email: 'veronica.matibag@santacruz.gov.ph', name: 'Maria Veronica Matibag', role: 'member', password: 'demo1234', initials: 'VM' },
    { email: 'secretariat@santacruz.gov.ph', name: 'SB Secretariat', role: 'secretariat', password: 'demo1234', initials: 'SS' },
    { email: 'mtop.clerk@santacruz.gov.ph', name: 'MTOP Window Clerk', role: 'operator', password: 'demo1234', initials: 'MC' },
  ],
});

export default santaCruzConfig;
