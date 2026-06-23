// Bridge between the @gelabs/sp/sync-client collections and the legacy prangkisa module's
// stage-keyed Application model. The legacy UI keeps its exact behaviour; this maps
// its reads/writes onto the offline-first collections (stage === wf.current).
import type { Application as LegacyApp, Mtop as LegacyMtop, StageId, Timeline } from '@/components/prangkisa/types';
import {
  applications, mtops, zones, todas,
  type Application as SpApp, type Mtop as SpMtop,
} from '@/data';
import { uuidv7, todayISO } from '@/store';

const STAGE_IDS: StageId[] = ['created', 'validation', 'inspection', 'payment', 'sb', 'issued'];

const zoneName = (id: string) => zones.all().find((z) => z.id === id)?.name ?? id;
const todaName = (id: string) => todas.all().find((t) => t.id === id)?.name ?? id;
const zoneIdOf = (name: string) => zones.all().find((z) => z.name === name)?.id ?? name;
const todaIdOf = (name: string) => todas.all().find((t) => t.name === name)?.id ?? name;

// ref → sync id, so a legacy write (keyed by ref) maps back to the right document.
const refToId = new Map<string, string>();
export function rememberIds(apps: SpApp[]): void {
  for (const a of apps) refToId.set(a.ref, a.id);
}

export function spToLegacyApp(a: SpApp): LegacyApp {
  const timeline: Timeline = {};
  for (const ev of a.timeline) timeline[ev.stage as StageId] = { at: ev.at, by: ev.by };
  return {
    ref: a.ref, type: a.type, unit: a.unit, plate: a.plate,
    zone: zoneName(a.zoneId), toda: todaName(a.todaId),
    applicantName: a.applicantName, applicantContact: a.applicantContact, applicantAddress: a.applicantAddress,
    stage: STAGE_IDS[Math.min(a.wf.current, 5)], updated: 'synced',
    amount: a.amount ?? 0, franchise: a.franchise ?? '', validity: a.validity,
    resolution: a.resolution, orNo: a.orNo, timeline,
  };
}

export function spToLegacyMtop(m: SpMtop): LegacyMtop {
  return {
    no: m.ref, status: m.status === 'expiring' ? 'expiring' : 'active', class: m.klass,
    zone: zoneName(m.zoneId), toda: todaName(m.todaId), unit: m.unit, operator: m.operator,
    validFrom: m.validFrom, validTo: m.validTo, resolution: m.resolution ?? '',
  };
}

/** Persist a legacy Application back into the sync collection (upsert by ref). */
export function persistLegacyApp(app: LegacyApp): void {
  const zoneId = zoneIdOf(app.zone);
  const todaId = todaIdOf(app.toda);
  const current = Math.max(0, STAGE_IDS.indexOf(app.stage));
  const timeline = Object.entries(app.timeline).map(([stage, e]) => ({ stage, at: e?.at ?? '', by: e?.by ?? '', action: 'update' }));
  const body: SpApp = {
    id: refToId.get(app.ref) ?? uuidv7(),
    ref: app.ref, type: app.type, unit: app.unit, plate: app.plate, zoneId, todaId,
    applicantName: app.applicantName ?? '', applicantContact: app.applicantContact, applicantAddress: app.applicantAddress,
    amount: app.amount, franchise: app.franchise, validity: app.validity, resolution: app.resolution, orNo: app.orNo,
    timeline, documents: [], wf: { def: 'mtop', current, history: [] },
  };

  const existingId = refToId.get(app.ref);
  if (existingId) {
    applications.update(existingId, body);
  } else {
    refToId.set(app.ref, body.id);
    applications.add(body);
  }

  // On issuance, mint the MTOP credential in the collection too.
  if (app.stage === 'issued' && app.franchise && !mtops.all().some((m) => m.ref === app.franchise)) {
    mtops.add({
      id: uuidv7(), ref: app.franchise, status: 'active', klass: 'For-hire tricycle',
      zoneId, todaId, unit: app.unit, operator: app.applicantName ?? '',
      validFrom: todayISO(), validTo: app.validity ?? '', resolution: app.resolution ?? '',
      applicationRef: app.ref, enforcement: [],
    });
  }
}
