"use client";

import { useState } from "react";

import { StageBadge } from "@/components/status-badges";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { STAGE_META, STAGE_ORDER, formatDate } from "@/lib/legislation";
import {
  COMMITTEES,
  DOCUMENTS,
  VOTE_RECORDS,
  documentById,
  memberById,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const VIEWS = [
  { id: "pipeline", label: "Pipeline" },
  { id: "committees", label: "Committees" },
  { id: "votes", label: "Voting" },
] as const;

type ViewId = (typeof VIEWS)[number]["id"];

export function TrackingBoard() {
  const [view, setView] = useState<ViewId>("pipeline");

  return (
    <div className="space-y-4">
      <div className="flex w-full gap-1 rounded-lg border p-1 sm:w-fit">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors sm:flex-none",
              view === v.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === "pipeline" ? <Pipeline /> : null}
      {view === "committees" ? <Committees /> : null}
      {view === "votes" ? <VotingRecords /> : null}
    </div>
  );
}

function Pipeline() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {STAGE_ORDER.map((stage) => {
        const docs = DOCUMENTS.filter((d) => d.stage === stage);
        return (
          <div key={stage} className="w-60 shrink-0">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">
                {STAGE_META[stage].label}
              </span>
              <Badge variant="secondary">{docs.length}</Badge>
            </div>
            <div className="space-y-2">
              {docs.length === 0 ? (
                <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                  None
                </div>
              ) : (
                docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="rounded-lg border bg-card p-3 shadow-sm"
                  >
                    <div className="font-mono text-xs text-muted-foreground">
                      {doc.referenceNo}
                    </div>
                    <div className="mt-1 text-sm leading-snug font-medium">
                      {doc.title}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{doc.category}</span>
                      <span>{formatDate(doc.lastActionDate)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Committees() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {COMMITTEES.map((c) => {
        const chair = memberById(c.chairId);
        const docs = DOCUMENTS.filter((d) => d.committeeId === c.id);
        return (
          <Card key={c.id}>
            <CardHeader>
              <CardTitle className="text-base">{c.name}</CardTitle>
              <CardDescription>
                Chair: {chair?.name ?? "—"} · {c.memberIds.length} members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{c.jurisdiction}</p>
              <Separator className="my-3" />
              <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Referred measures ({docs.length})
              </div>
              <ul className="mt-2 space-y-1.5">
                {docs.length === 0 ? (
                  <li className="text-sm text-muted-foreground">
                    No measures referred.
                  </li>
                ) : (
                  docs.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="truncate">{d.title}</span>
                      <StageBadge stage={d.stage} />
                    </li>
                  ))
                )}
              </ul>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function VotingRecords() {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Measure</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead className="whitespace-nowrap">Date</TableHead>
            <TableHead className="text-center">Yes</TableHead>
            <TableHead className="text-center">No</TableHead>
            <TableHead className="text-center">Abstain</TableHead>
            <TableHead>Result</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {VOTE_RECORDS.map((v) => {
            const doc = documentById(v.documentId);
            const passed = v.tally.yes > v.tally.no;
            return (
              <TableRow key={`${v.documentId}-${v.stage}`}>
                <TableCell>
                  <div className="font-mono text-xs text-muted-foreground">
                    {doc?.referenceNo ?? "—"}
                  </div>
                  <div className="text-sm font-medium">{doc?.title ?? "—"}</div>
                </TableCell>
                <TableCell>
                  <StageBadge stage={v.stage} />
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {formatDate(v.date)}
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {v.tally.yes}
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {v.tally.no}
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {v.tally.abstain}
                </TableCell>
                <TableCell>
                  <Badge variant={passed ? "default" : "destructive"}>
                    {passed ? "Carried" : "Failed"}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
