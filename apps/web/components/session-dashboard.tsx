"use client";

import { useMemo, useState } from "react";
import { CalendarDays, FileText, Pencil, Plus, Radio, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { OcrBadge, StageBadge } from "@/components/status-badges";
import { SessionForm } from "@/components/session-form";
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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatConfidence, formatDate } from "@/lib/legislation";
import { authorNames } from "@/lib/reference-data";
import { members as membersCol, sessions as sessionsCol, type SpSession } from "@/data";
import { cn } from "@/lib/utils";
import type {
  LegislativeDocument,
  Session,
  SessionMode,
  SessionStatus,
} from "@/types/legislation";

const MODE_LABEL: Record<SessionMode, string> = {
  in_person: "In-person",
  virtual: "Virtual",
  hybrid: "Hybrid",
};

const STATUS_META: Record<
  SessionStatus,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  scheduled: { label: "Scheduled", variant: "secondary" },
  in_progress: { label: "In session", variant: "default" },
  adjourned: { label: "Adjourned", variant: "outline" },
};

export function SessionDashboard({
  sessions,
  documents,
  canManage,
}: {
  sessions: Session[];
  documents: LegislativeDocument[];
  canManage: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SpSession | undefined>(undefined);
  const [toDelete, setToDelete] = useState<{ id: string; title: string } | null>(null);

  const docById = useMemo(
    () => new Map(documents.map((d) => [d.id, d])),
    [documents],
  );

  const firstDocOf = (id: string): string | null =>
    sessions.find((s) => s.id === id)?.agenda.find((a) => a.documentId)
      ?.documentId ?? null;

  const initialId =
    sessions.find((s) => s.status === "scheduled")?.id ?? sessions[0]?.id ?? "";

  const [sessionId, setSessionId] = useState<string>(initialId);
  const [docId, setDocId] = useState<string | null>(() =>
    firstDocOf(initialId),
  );

  const session = sessions.find((s) => s.id === sessionId) ?? sessions[0];
  const selectedDoc = docId ? docById.get(docId) : undefined;

  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

  const openEdit = (id: string) => {
    setEditing(sessionsCol.get(id));
    setFormOpen(true);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    sessionsCol.remove(toDelete.id);
    toast.success("Session deleted.");
    setToDelete(null);
  };

  // Shared create/edit + delete dialogs — rendered in every branch (incl. empty state).
  const dialogs = (
    <>
      <SessionForm open={formOpen} onOpenChange={setFormOpen} session={editing} />
      <Dialog open={toDelete !== null} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete session?</DialogTitle>
            <DialogDescription>
              Delete <strong>{toDelete?.title}</strong> and its order of business. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" onClick={confirmDelete}>
              <Trash2 className="size-4" /> Delete session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  if (!session) {
    return (
      <>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center text-sm text-muted-foreground">
            No sessions on record yet.
            {canManage ? (
              <Button size="sm" onClick={openCreate}>
                <Plus className="size-4" /> New session
              </Button>
            ) : null}
          </CardContent>
        </Card>
        {dialogs}
      </>
    );
  }

  const docCount = session.agenda.filter((a) => a.documentId).length;

  const selectSession = (id: string) => {
    setSessionId(id);
    setDocId(firstDocOf(id));
  };

  const changeStatus = (status: SessionStatus) => {
    sessionsCol.update(session.id, { status });
    toast.success(status === "in_progress" ? "Session opened" : "Session adjourned");
  };

  return (
    <div className="space-y-4">
      {/* toolbar */}
      {canManage ? (
        <div className="flex justify-end">
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" /> New session
          </Button>
        </div>
      ) : null}
      {/* session picker */}
      <div className="flex flex-wrap gap-2">
        {sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => selectSession(s.id)}
            className={cn(
              "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
              s.id === session.id
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "hover:bg-accent",
            )}
          >
            <div className="font-medium">{s.title}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {formatDate(s.date)} · {MODE_LABEL[s.mode]}
            </div>
          </button>
        ))}
      </div>

      {/* session meta */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="size-4" /> {formatDate(session.date)}
        </span>
        <span className="flex items-center gap-1.5">
          <Radio className="size-4" /> {MODE_LABEL[session.mode]}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="size-4" /> {membersCol.all().length} members
        </span>
        <span className="flex items-center gap-1.5">
          <FileText className="size-4" /> {docCount} document
          {docCount === 1 ? "" : "s"} on agenda
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* order of business */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle>Order of Business</CardTitle>
                <CardDescription>{session.title}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_META[session.status].variant}>
                  {STATUS_META[session.status].label}
                </Badge>
                {canManage && session.status === "scheduled" ? (
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() => changeStatus("in_progress")}
                  >
                    Open session
                  </Button>
                ) : null}
                {canManage && session.status === "in_progress" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => changeStatus("adjourned")}
                  >
                    Adjourn
                  </Button>
                ) : null}
                {canManage ? (
                  <>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Edit session"
                      onClick={() => openEdit(session.id)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Delete session"
                      onClick={() => setToDelete({ id: session.id, title: session.title })}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {session.agenda.map((item) => {
              const doc = item.documentId
                ? docById.get(item.documentId)
                : undefined;
              const isSelected = Boolean(doc) && docId === item.documentId;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-start gap-3 rounded-md px-2 py-2",
                    isSelected && "bg-accent",
                  )}
                >
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium tabular-nums">
                    {item.order}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs tracking-wide text-muted-foreground uppercase">
                      {item.type}
                    </div>
                    <div className="font-medium">{item.title}</div>
                  </div>
                  {doc ? (
                    <Button
                      variant={isSelected ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => setDocId(item.documentId ?? null)}
                    >
                      <FileText className="size-4" /> View
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* in-session document viewer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-4" /> In-session viewer
            </CardTitle>
            <CardDescription>
              {selectedDoc ? selectedDoc.referenceNo : "No document selected"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedDoc ? (
              <div className="space-y-3">
                <div>
                  <div className="font-heading text-base font-semibold">
                    {selectedDoc.title}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline">{selectedDoc.type}</Badge>
                    <Badge variant="outline">{selectedDoc.category}</Badge>
                    <StageBadge stage={selectedDoc.stage} />
                  </div>
                </div>
                <Separator />
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Author(s)</dt>
                    <dd className="text-right">{authorNames(selectedDoc)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Filed</dt>
                    <dd>{formatDate(selectedDoc.dateFiled)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">Source</dt>
                    <dd>
                      <OcrBadge status={selectedDoc.ocrStatus} />
                    </dd>
                  </div>
                  {selectedDoc.source === "scanned" &&
                  selectedDoc.ocrStatus === "processed" &&
                  selectedDoc.ocrConfidence !== undefined ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">OCR confidence</dt>
                      <dd>{formatConfidence(selectedDoc.ocrConfidence)}</dd>
                    </div>
                  ) : null}
                </dl>
                <Separator />
                <div>
                  <div className="text-xs tracking-wide text-muted-foreground uppercase">
                    Summary
                  </div>
                  <p className="mt-1 text-sm">{selectedDoc.summary}</p>
                </div>
                {!selectedDoc.fullTextAvailable ? (
                  <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    Full text unavailable — OCR did not produce reliable text
                    for this scanned record.
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select an agenda item marked with a document to preview it here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {dialogs}
    </div>
  );
}
