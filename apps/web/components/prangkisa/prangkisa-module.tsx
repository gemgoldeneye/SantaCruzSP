"use client";

/* ============================================================
   PRANGKISA — module shell. One client root holds the working
   store + an internal view router so the file → inspect → pay →
   SB-approve → issue flow keeps its state across screens. Initial
   data is hydrated from the server (Postgres) and every mutation
   is persisted back via /api/prangkisa/applications/[ref].
   ============================================================ */

import { useState } from "react";

import { ApplyWizard } from "./apply";
import { MtopView, Verify } from "./credential";
import type { Zone } from "./data";
import type { Toda, Fee, AppDoc } from "@/data";
import { Dashboard } from "./dashboard";
import { AppDetail } from "./detail";
import { Payment } from "./payment";
import type { Application, Go, Mtop, Route, Store } from "./types";
import { persistLegacyApp } from "@/lib/prangkisaAdapt";

function keyByRef(apps: Application[]): Record<string, Application> {
  const out: Record<string, Application> = {};
  apps.forEach((a) => {
    out[a.ref] = a;
  });
  return out;
}

// Offline-durable: persist the legacy Application into the @gelabs/sp/sync-client
// collection (mapped to the wf-based document) instead of a REST PUT.
function persistApplication(app: Application): void {
  persistLegacyApp(app);
}

export function PrangkisaModule({
  initialApps,
  mtops,
  zones,
  todas,
  fees,
  appDocs,
}: {
  initialApps: Application[];
  mtops: Mtop[];
  zones: Zone[];
  todas: Toda[];
  fees: Fee[];
  appDocs: AppDoc[];
}) {
  const [apps, setApps] = useState<Record<string, Application>>(() =>
    keyByRef(initialApps),
  );
  const [route, setRoute] = useState<Route>({ name: "dashboard", params: {} });

  const store: Store = {
    all: () => Object.values(apps),
    getApp: (ref) => apps[ref],
    upsert: (app) => {
      setApps((s) => ({ ...s, [app.ref]: app }));
      persistApplication(app);
    },
    update: (ref, fn) => {
      const current = apps[ref];
      if (!current) return;
      const next = fn(current);
      setApps((s) => ({ ...s, [ref]: next }));
      persistApplication(next);
    },
  };

  const go: Go = (name, params = {}) => {
    if (params.app) store.upsert(params.app);
    setRoute({ name, params });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "auto" });
  };

  let screen;
  switch (route.name) {
    case "apply":
      screen = (
        <ApplyWizard
          go={go}
          params={route.params}
          store={store}
          zones={zones}
          todas={todas}
          fees={fees}
          appDocs={appDocs}
        />
      );
      break;
    case "detail":
      screen = <AppDetail go={go} params={route.params} store={store} />;
      break;
    case "payment":
      screen = <Payment go={go} params={route.params} store={store} fees={fees} />;
      break;
    case "mtop":
      screen = (
        <MtopView go={go} params={route.params} store={store} mtops={mtops} />
      );
      break;
    case "verify":
      screen = <Verify go={go} params={route.params} />;
      break;
    default:
      screen = <Dashboard go={go} store={store} mtops={mtops} zones={zones} />;
  }

  return <div className="mx-auto w-full max-w-6xl">{screen}</div>;
}
