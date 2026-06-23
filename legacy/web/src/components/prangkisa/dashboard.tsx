"use client";

import { AlertTriangle, BadgeCheck, Clock, Hash, Plus, QrCode, RefreshCw } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronRight } from "lucide-react";

import { MTOPS } from "./data";
import {
  CredentialCard,
  StatCard,
  StatusBadge,
  TypeBadge,
  mtopStatus,
} from "./shared";
import type { Go, Store } from "./types";

export function Dashboard({ go, store }: { go: Go; store: Store }) {
  const apps = store.all();
  const actionNeeded = apps.filter((a) => a.timeline[a.stage]?.action).length;
  const inProgress = apps.filter((a) => a.stage !== "issued").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tricycle Franchising & MTOP"
        description="Prangkisa — file tricycle franchise applications, track them through inspection, payment and SB action, and issue QR-verifiable digital MTOPs."
        actions={
          <Button onClick={() => go("apply")}>
            <Plus /> New application
          </Button>
        }
      />

      {/* stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={BadgeCheck} label="Active MTOPs" value={MTOPS.length} />
        <StatCard icon={Clock} label="In progress" value={inProgress} />
        <StatCard icon={AlertTriangle} label="Action needed" value={actionNeeded} />
        <StatCard icon={Hash} label="Vacant in zone" value={24} />
      </div>

      {/* action-needed banner */}
      {actionNeeded > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <p>
            <span className="font-semibold">
              {actionNeeded} application{actionNeeded > 1 ? "s" : ""} need your attention.
            </span>{" "}
            Santa Cruz processes under RA 11032 &ldquo;complete-or-return-once&rdquo; — clear the flagged
            item to keep the application moving.
          </p>
        </div>
      )}

      {/* My applications */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-lg font-semibold">My applications</h2>
            <Badge variant="secondary">{apps.length}</Badge>
          </div>
          <Button variant="outline" size="sm" onClick={() => go("apply")}>
            <Plus /> New
          </Button>
        </div>
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="whitespace-nowrap">Updated</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {apps.map((a) => (
                <TableRow
                  key={a.ref}
                  onClick={() => go("detail", { ref: a.ref })}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <span className="font-mono text-sm font-semibold text-primary">{a.ref}</span>
                  </TableCell>
                  <TableCell>
                    <TypeBadge type={a.type} />
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{a.unit}</div>
                    <div className="text-xs text-muted-foreground">{a.toda}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{a.zone}</TableCell>
                  <TableCell>
                    <StatusBadge stage={a.stage} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {a.updated}
                  </TableCell>
                  <TableCell className="text-right">
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Active MTOPs */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-semibold">Your franchises</h2>
          <span className="text-xs font-medium text-muted-foreground">QR-verifiable · LTO-ready</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {MTOPS.map((m) => {
            const expiring = m.status === "expiring";
            return (
              <div key={m.no} className="space-y-2">
                <CredentialCard
                  kicker="MTOP · Santa Cruz, Zambales"
                  title={m.class}
                  status={mtopStatus(m.status)}
                  number={m.no}
                  fields={[
                    { k: "Zone", v: m.zone },
                    { k: "Unit", v: m.unit },
                    { k: "Valid until", v: m.validTo },
                    { k: "Resolution", v: m.resolution },
                  ]}
                  qrValue={m.no}
                  qrSize={84}
                  sealSize={36}
                />
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => go("mtop", { no: m.no })}>
                    <QrCode /> View credential
                  </Button>
                  {expiring && (
                    <Button
                      size="sm"
                      onClick={() => go("apply", { preType: "RENEWAL", franchise: m.no })}
                    >
                      <RefreshCw /> Renew now
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
