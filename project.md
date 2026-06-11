# Santa Cruz Sanggunian — Santa Cruz Legislative E-Archive & Session

> **Holistic project context — single source of truth for _what_ we're building and _why_.**
> Keep this current as scope evolves. Day-to-day execution logs live in [`progress.md`](./progress.md);
> breakthroughs, decisions, and milestones live in [`learnings.md`](./learnings.md).

---

## 📌 At a glance

| | |
|---|---|
| **Folder codename** | `sp` — *Sangguniang Bayan ng Santa Cruz* (Municipal Council) |
| **Product name** | Santa Cruz Sanggunian — Santa Cruz Legislative E-Archive & Session |
| **Type** | Cloud-based **web application** (browser-accessible, no local install) |
| **Stack** | **Next.js + React + TypeScript** |
| **Client / domain** | Sangguniang Bayan ng Santa Cruz, Zambales (municipal council) |
| **Status** | 🟢 Brand new — kickoff **2026-05-26** |
| **Current focus** | **Front-end** |

---

## 🎯 Mission & problem

The legislative processes of the Sangguniang Bayan ng Santa Cruz still depend heavily on physical
filing cabinets, paper agendas, and manual tracking. Councilors lose time searching for past
resolutions, sessions consume large amounts of paper, and decades of older records are locked
away in scanned/physical form that can't be searched.

**Santa Cruz Sanggunian modernizes these processes** by giving councilors and the Secretariat
immediate browser-based access to resolutions, intelligent keyword search across both digital
*and* scanned records, and tools to run efficient paperless sessions — securely, from any
device with an internet connection.

---

## 👥 Users

- **Councilors** — search records, view session agendas, track their own legislation, vote.
- **Secretariat** — upload & categorize documents (incl. scanned), run OCR, manage the order of business, generate reports.
- **Residents of Santa Cruz** *(optional public portal)* — access approved ordinances, track projects, submit feedback.

---

## 🚀 Core modules

### 1. Advanced Smart Search & OCR-Powered E-Library
Eliminates time wasted searching physical filing cabinets; reads both digital and scanned files.
- **OCR for scanned documents** — when the Secretariat uploads scanned copies of older ordinances/resolutions, OCR automatically extracts the text, making decades of physical records readable and fully searchable.
- **Full-text search** — keyword search scans the actual text inside uploaded PDFs.
- **Codified e-library** — categorized repository of local laws (Environment, Agriculture, Tourism, Budget, …).
- **Advanced filtering** — by Reference Number, Author/Sponsor, Year, and Document Type (Committee Reports, Draft Resolutions, Executive Orders, …).

### 2. Paperless Session Dashboard
Designed for live use during Sanggunian sessions to cut paper waste and improve efficiency.
- **Digital Order of Business** — live agenda with attached documents in real time on tablets/laptops.
- **In-session document viewer** — open e-copies of draft resolutions, prior minutes, and committee reports inside the app.
- **Virtual & hybrid sessions** — support remote sessions during emergencies so legislative duties are never disrupted.

### 3. Legislative Tracking & Workflow
Lets councilors see exactly where their proposed resolutions stand.
- **Visual pipeline** — status of pending ordinances (First Reading → Committee Review → Second/Third Reading → Mayor's Approval).
- **Committee hubs** — dedicated workspaces for standing committees (Appropriations, Public Works, …) for reports, schedules, hearings.
- **Voting records** — digital, transparent, easily accessible history of council decisions.

### 4. Data Analytics & Secretariat Reports
- **Executive dashboard** — real-time metrics: active documents, pending approvals, committee productivity.
- **Automated document processing** — batch-upload, OCR text extraction, auto-categorization for instant searchability.

---

## ⚙️ Technical foundations & compliance

- **Cloud-based web-app** — Next.js + React + TypeScript; accessible securely from any device with internet (capitol or fieldwork).
- **E-Governance alignment** — built toward national "Smart LGU" / E-Governance mandates: interoperability and centralized data management.
- **Public transparency** *(optional expansion)* — citizen-facing portal bridging government and community.

---

## 🧭 Scope & phasing

- **This repo / current phase:** the **front-end web-app** (UI, navigation, module screens, mock/placeholder data where backend isn't ready).
- **Out of scope for now (assumed later):** production backend/API, real OCR service integration, auth provider, persistent database, deployment infrastructure. We'll design the front-end to slot these in cleanly.

> The detailed, evolving roadmap and per-step status live in [`progress.md`](./progress.md).

---

## 📖 Glossary

| Term | Meaning |
|---|---|
| **Sangguniang Bayan (SB)** | The municipal legislative council (the "Sanggunian" at municipal level). |
| **Sanggunian** | A local legislative council in the Philippines. |
| **LGU** | Local Government Unit. |
| **Ordinance** | A local law of permanent/general character. |
| **Resolution** | An expression of the council's opinion or will on a specific matter. |
| **Order of Business** | The official agenda/sequence of a session. |
| **Secretariat** | Staff who manage records, agendas, and documentation for the Sanggunian. |
| **OCR** | Optical Character Recognition — extracting machine-readable text from scanned images/PDFs. |
| **Reading (1st/2nd/3rd)** | Stages a measure passes through before approval. |

---

*Last updated: 2026-05-26*
