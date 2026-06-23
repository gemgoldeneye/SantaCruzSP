"use client";

/* ============================================================
   PRANGKISA — module shell. One client root holds the in-memory
   store + an internal view router so the file → inspect → pay →
   SB-approve → issue flow keeps its state across screens, while
   the surrounding Santa Cruz Sanggunian app shell (rail + topbar +
   theme) stays in charge of chrome and branding.
   ============================================================ */

import { useState } from "react";

import { APPLICATIONS } from "./data";
import { ApplyWizard } from "./apply";
import { MtopView, Verify } from "./credential";
import { Dashboard } from "./dashboard";
import { AppDetail } from "./detail";
import { Payment } from "./payment";
import type { Application, Go, Route, Store } from "./types";

function cloneSeed(): Record<string, Application> {
  const out: Record<string, Application> = {};
  (JSON.parse(JSON.stringify(APPLICATIONS)) as Application[]).forEach((a) => {
    out[a.ref] = a;
  });
  return out;
}

export function PrangkisaModule() {
  const [apps, setApps] = useState<Record<string, Application>>(cloneSeed);
  const [route, setRoute] = useState<Route>({ name: "dashboard", params: {} });

  const store: Store = {
    all: () => Object.values(apps),
    getApp: (ref) => apps[ref],
    upsert: (app) => setApps((s) => ({ ...s, [app.ref]: app })),
    update: (ref, fn) => setApps((s) => (s[ref] ? { ...s, [ref]: fn(s[ref]) } : s)),
  };

  const go: Go = (name, params = {}) => {
    if (params.app) store.upsert(params.app);
    setRoute({ name, params });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "auto" });
  };

  let screen;
  switch (route.name) {
    case "apply":
      screen = <ApplyWizard go={go} params={route.params} store={store} />;
      break;
    case "detail":
      screen = <AppDetail go={go} params={route.params} store={store} />;
      break;
    case "payment":
      screen = <Payment go={go} params={route.params} store={store} />;
      break;
    case "mtop":
      screen = <MtopView go={go} params={route.params} store={store} />;
      break;
    case "verify":
      screen = <Verify go={go} params={route.params} store={store} />;
      break;
    default:
      screen = <Dashboard go={go} store={store} />;
  }

  return <div className="mx-auto w-full max-w-6xl">{screen}</div>;
}
