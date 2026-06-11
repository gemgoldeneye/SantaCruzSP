"use client";

import { useState } from "react";
import { CalendarDays, FileText, Radio, Users } from "lucide-react";

import { OcrBadge, StageBadge } from "@/components/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatConfidence, formatDate } from "@/lib/legislation";
import {
  BOARD_MEMBERS,
  SESSIONS,
  authorNames,
  documentById,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { SessionMode, SessionStatus } from "@/types/legislation";

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

const firstDocOf = (sessionId: string): string | null =>
  SESSIONS.find((s) => s.id === sessionId)?.agenda.find((a) => a.documentId)
    ?.documentId ?? null;

export function SessionDashboard() {
  const [sessionId, setSessionId] = useState<string>(
    SESSIONS.find((s) => s.status === "scheduled")?.id ?? SESSIONS[0].id,
  );
  const [docId, setDocId] = useState<string | null>(() =>
    firstDocOf(
      SESSIONS.find((s) => s.status === "scheduled")?.id ?? SESSIONS[0].id,
    ),
  );

  const session = SESSIONS.find((s) => s.id === sessionId) ?? SESSIONS[0];
  const selectedDoc = docId ? documentById(docId) : undefined;
  const docCount = session.agenda.filter((a) => a.documentId).length;

  const selectSession = (id: string) => {
    setSessionId(id);
    setDocId(firstDocOf(id));
  };

  return (
    <div className="space-y-4">
      {/* session picker */}
      <div className="flex flex-wrap gap-2">
        {SESSIONS.map((s) => (
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
          <Users className="size-4" /> {BOARD_MEMBERS.length} members
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
              <Badge variant={STATUS_META[session.status].variant}>
                {STATUS_META[session.status].label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {session.agenda.map((item) => {
              const doc = item.documentId
                ? documentById(item.documentId)
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
    </div>
  );
}
