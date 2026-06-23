// FIRST: register the standard SP collections + workflows (side-effect) BEFORE the
// createCollection() calls below — otherwise collections register device-local and
// silently stop syncing. (The Vite app guaranteed this via main.tsx import order;
// here it's pinned at the top of data.ts so any importer is safe.)
import '@gelabs/sp/modules';
// Set apiBase/appKey BEFORE the createCollection() calls below: createCollection
// calls registryKey() → getConfig().appKey, which throws if config is unset. (The
// ensureDeviceId() guard makes initSyncConfig SSR-safe; bootSync re-applies the
// real localStorage device id on the client.)
import './syncConfig';

// Collection seams. Each maps to a @gelabs/sp/contracts registry key (appKey 'sp' is
// prepended by the sync layer), so reads are reactive-local and writes enqueue
// offline-durable mutations. Seeds are empty: synced collections hydrate from
// the server, not a client seed.
import type { WorkflowInstance } from '@gelabs/sp/contracts';
import { createCollection, type Identified } from './store';

export interface SpDocument extends Identified {
  ref: string; title: string; type: string; category: string; year: number;
  dateFiled: string; summary: string; stage: string; committeeId?: string;
  authors: string[]; nextAction?: string; lastActionDate?: string;
  source: 'digital' | 'scanned';
  ocrStatus: 'not_applicable' | 'pending' | 'processing' | 'processed' | 'failed';
  ocrConfidence?: number; fullTextAvailable: boolean; extractedText?: string; pageCount?: number;
  votes?: Record<string, { yes: number; no: number; abstain: number; absent?: number; date?: string }>;
  wf: WorkflowInstance;
}

export interface AgendaItem { id: string; order: number; type: string; title: string; documentRef?: string }
export interface SpSession extends Identified {
  title: string; date: string; mode: 'in_person' | 'virtual' | 'hybrid';
  status: 'scheduled' | 'in_progress' | 'adjourned'; agenda: AgendaItem[];
}

export interface Committee extends Identified { name: string; jurisdiction: string; chairId?: string; roster: { boardMemberId: string }[] }
export interface BoardMember extends Identified { name: string; district?: string; role: string }

export interface Application extends Identified {
  ref: string; type: 'NEW_MTOP' | 'RENEWAL' | 'CHANGE_MOTOR' | 'DROPPING';
  unit: string; plate: string; zoneId: string; todaId: string;
  applicantName: string; applicantContact?: string; applicantAddress?: string;
  amount?: number; franchise?: string; validity?: string; resolution?: string; orNo?: string;
  timeline: { stage: string; at: string; by: string; action: string; note?: string }[];
  documents: { docId: string; uploaded: boolean; uploadedAt?: string }[];
  wf: WorkflowInstance;
}

export interface Mtop extends Identified {
  ref: string; status: 'active' | 'expiring' | 'suspended' | 'revoked' | 'expired';
  klass: string; zoneId: string; todaId: string; unit: string; operator: string;
  validFrom: string; validTo: string; resolution?: string; applicationRef?: string;
  enforcement: { action: string; actor: string; at: string; reason?: string }[];
}

export interface Zone extends Identified { name: string; kind: 'Poblacion' | 'Rural'; cap: number; used: number; frozen: boolean }
export interface Toda extends Identified { name: string }
export interface Fee extends Identified { appType: string; label: string; amount: number; confirmed: boolean; sortOrder: number }
export interface AppDoc extends Identified { name: string; sub?: string; appType: string; newUnit: boolean }
export interface Project extends Identified { name: string; municipality: string; status: 'Ongoing' | 'Planned' | 'Completed'; budget: number; sortOrder: number }

export const documents = createCollection<SpDocument>('sanggunian.documents', [], 1);
export const sessions = createCollection<SpSession>('sanggunian.sessions', [], 1);
export const committees = createCollection<Committee>('sanggunian.bodies', [], 1);
export const members = createCollection<BoardMember>('sanggunian.members', [], 1);
export const applications = createCollection<Application>('mtop.applications', [], 1);
export const mtops = createCollection<Mtop>('mtop.mtops', [], 1);
export const zones = createCollection<Zone>('mtop.zones', [], 1);
export const todas = createCollection<Toda>('mtop.todas', [], 1);
export const fees = createCollection<Fee>('treasury.fees', [], 1);
export const appDocs = createCollection<AppDoc>('mtop.requirements', [], 1);
export const projects = createCollection<Project>('portal.projects', [], 1);

// Citizen-writable: portal feedback (offline-durable, attributed to the signed-in citizen).
export interface Feedback extends Identified {
  accountId?: string; name?: string; email?: string; message: string; createdAt: string;
}
export const feedback = createCollection<Feedback>('portal.feedback', [], 1);
