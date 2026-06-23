'use client';

import { useMemo } from 'react';
import { PrangkisaModule } from '@/components/prangkisa/prangkisa-module';
import type { Zone } from '@/components/prangkisa/data';
import { applications, mtops, zones, todas, fees, appDocs } from '@/data';
import { rememberIds, spToLegacyApp, spToLegacyMtop } from '@/lib/prangkisaAdapt';

export default function PrangkisaPage() {
  const apps = applications.useItems();
  const franchises = mtops.useItems();
  const zoneRows = zones.useItems();
  const todaRows = todas.useItems();
  const feeRows = fees.useItems();
  const docRows = appDocs.useItems();

  const initialApps = useMemo(() => { rememberIds(apps); return apps.map(spToLegacyApp); }, [apps]);
  const legacyMtops = useMemo(() => franchises.map(spToLegacyMtop), [franchises]);
  // SpZone is structurally identical to the prangkisa Zone shape.
  const zoneList = zoneRows as Zone[];

  return <PrangkisaModule initialApps={initialApps} mtops={legacyMtops} zones={zoneList} todas={todaRows} fees={feeRows} appDocs={docRows} />;
}
