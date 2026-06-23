"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { StageBadge } from "@/components/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePagination } from "@/hooks/use-pagination";
import { STAGE_META, STAGE_ORDER, formatDate, nextStages } from "@/lib/legislation";
import { committees as committeesCol, documents as docsCol, members as membersCol } from "@/data";
import { cn } from "@/lib/utils";
import type {
  LegislativeDocument,
  LegislativeStage,
  VoteRecord,
} from "@/types/legislation";

const VIEWS = [
  { id: "pipeline", label: "Pipeline" },
  { id: "committees", label: "Committees" },
  { id: "votes", label: "Voting" },
] as const;

type ViewId = (typeof VIEWS)[number]["id"];

/** Stages at which a council roll-call vote is recorded. */
const VOTABLE_STAGES: LegislativeStage[] = [
  "first_reading",
  "committee_review",
  "second_reading",
  "third_reading",
];

type Tally = { yes: number; no: number; abstain: number; absent: number };

export function TrackingBoard({
  documents,
  votes,
}: {
  documents: LegislativeDocument[];
  votes: VoteRecord[];
}) {
  const [view, setView] = useState<ViewId>("pipeline");
  const [voteDoc, setVoteDoc] = useState<LegislativeDocument | null>(null);
  const [busy, setBusy] = useState(false);

  // Offline-durable: a stage change is a plain field update on the sync collection.
  const advance = (doc: LegislativeDocument, toStage: LegislativeStage) => {
    docsCol.update(doc.id, { stage: toStage, lastActionDate: new Date().toISOString().slice(0, 10) });
    toast.success(`${doc.referenceNo} → ${STAGE_META[toStage].label}`);
  };

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

      {view === "pipeline" ? (
        <Pipeline
          documents={documents}
          busy={busy}
          onAdvance={advance}
          onVote={setVoteDoc}
        />
      ) : null}
      {view === "committees" ? <Committees documents={documents} /> : null}
      {view === "votes" ? (
        <VotingRecords votes={votes} documents={documents} />
      ) : null}

      <VoteDialog
        doc={voteDoc}
        votes={votes}
        onOpenChange={(open) => {
          if (!open) setVoteDoc(null);
        }}
        onRecorded={() => {
          setVoteDoc(null);
            }}
      />
    </div>
  );
}

function Pipeline({
  documents,
  busy,
  onAdvance,
  onVote,
}: {
  documents: LegislativeDocument[];
  busy: boolean;
  onAdvance: (doc: LegislativeDocument, toStage: LegislativeStage) => void;
  onVote: (doc: LegislativeDocument) => void;
}) {
  // STAGE_ORDER omits the terminal `vetoed` branch; surface it as its own
  // column when any measure has been vetoed, so a veto never reads as a delete.
  const columns: LegislativeStage[] = documents.some((d) => d.stage === "vetoed")
    ? [...STAGE_ORDER, "vetoed"]
    : STAGE_ORDER;
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {columns.map((stage) => {
        const docs = documents.filter((d) => d.stage === stage);
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
                docs.map((doc) => {
                  const nexts = nextStages(doc.stage);
                  const votable = VOTABLE_STAGES.includes(doc.stage);
                  return (
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
                      {votable || nexts.length > 0 ? (
                        <div className="mt-2.5 flex flex-wrap gap-1.5 border-t pt-2.5">
                          {votable ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() => onVote(doc)}
                            >
                              Record vote
                            </Button>
                          ) : null}
                          {nexts.map((s) => (
                            <Button
                              key={s}
                              size="sm"
                              variant={s === "vetoed" ? "destructive" : "secondary"}
                              disabled={busy}
                              onClick={() => onAdvance(doc, s)}
                            >
                              {s === "vetoed" ? "Veto" : `→ ${STAGE_META[s].short}`}
                            </Button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Committees({ documents }: { documents: LegislativeDocument[] }) {
  const committees = committeesCol.useItems();
  const members = membersCol.useItems();
  const memberName = (id?: string) => members.find((m) => m.id === id)?.name;

  if (committees.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No committees on record yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {committees.map((c) => {
        const docs = documents.filter((d) => d.committeeId === c.id);
        return (
          <Card key={c.id}>
            <CardHeader>
              <CardTitle className="text-base">{c.name}</CardTitle>
              <CardDescription>
                Chair: {memberName(c.chairId) ?? "—"} · {c.roster.length} members
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

function VotingRecords({
  votes,
  documents,
}: {
  votes: VoteRecord[];
  documents: LegislativeDocument[];
}) {
  const docById = useMemo(
    () => new Map(documents.map((d) => [d.id, d])),
    [documents],
  );
  const pager = usePagination(votes, 12);

  return (
    <div className="space-y-3">
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
          {pager.pageItems.map((v) => {
            const doc = docById.get(v.documentId);
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
      <Pagination
        page={pager.page}
        pageCount={pager.pageCount}
        total={pager.total}
        from={pager.from}
        to={pager.to}
        onPageChange={pager.setPage}
        noun="vote record"
      />
    </div>
  );
}

const ZERO_TALLY: Tally = { yes: 0, no: 0, abstain: 0, absent: 0 };
const TALLY_FIELDS: { key: keyof Tally; label: string }[] = [
  { key: "yes", label: "Yes" },
  { key: "no", label: "No" },
  { key: "abstain", label: "Abstain" },
  { key: "absent", label: "Absent" },
];

function VoteDialog({
  doc,
  votes,
  onOpenChange,
  onRecorded,
}: {
  doc: LegislativeDocument | null;
  votes: VoteRecord[];
  onOpenChange: (open: boolean) => void;
  onRecorded: () => void;
}) {
  const existing = doc
    ? votes.find((v) => v.documentId === doc.id && v.stage === doc.stage)
    : undefined;

  return (
    <Dialog open={Boolean(doc)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record roll-call vote</DialogTitle>
          <DialogDescription>
            {doc ? `${doc.referenceNo} · ${STAGE_META[doc.stage].label}` : null}
          </DialogDescription>
        </DialogHeader>
        {/* Re-mount per measure so the form re-seeds from its own tally. */}
        {doc ? (
          <VoteForm
            key={doc.id}
            doc={doc}
            initial={existing ? { ...existing.tally } : ZERO_TALLY}
            onRecorded={onRecorded}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function VoteForm({
  doc,
  initial,
  onRecorded,
}: {
  doc: LegislativeDocument;
  initial: Tally;
  onRecorded: () => void;
}) {
  const [tally, setTally] = useState<Tally>(initial);
  const [busy, setBusy] = useState(false);

  // The roll-call is a keyed-by-stage update; the server mirrors it into the
  // promoted vote_records table (one tally per measure per stage).
  const submit = () => {
    const sp = docsCol.get(doc.id);
    const votes = { ...(sp?.votes ?? {}), [doc.stage]: { ...tally, date: new Date().toISOString().slice(0, 10) } };
    docsCol.update(doc.id, { votes });
    toast.success(`Roll-call recorded for ${doc.referenceNo}`);
    onRecorded();
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {TALLY_FIELDS.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label htmlFor={`tally-${f.key}`}>{f.label}</Label>
            <Input
              id={`tally-${f.key}`}
              type="number"
              min={0}
              value={tally[f.key]}
              onChange={(e) =>
                setTally((t) => ({
                  ...t,
                  [f.key]: Math.max(0, Number(e.target.value) || 0),
                }))
              }
            />
          </div>
        ))}
      </div>
      <DialogFooter showCloseButton>
        <Button onClick={submit} disabled={busy}>
          {busy ? "Recording…" : "Record vote"}
        </Button>
      </DialogFooter>
    </>
  );
}
