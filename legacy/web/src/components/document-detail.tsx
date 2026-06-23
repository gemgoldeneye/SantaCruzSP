"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { OcrBadge, StageBadge } from "@/components/status-badges";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { findDocumentById } from "@/lib/documents-store";
import { documentBody, formatConfidence, formatDate } from "@/lib/legislation";
import { authorNames } from "@/lib/mock-data";
import type { LegislativeDocument } from "@/types/legislation";

export function DocumentDetail({ id }: { id: string }) {
  const [doc, setDoc] = useState<LegislativeDocument | null | undefined>(
    undefined,
  );

  useEffect(() => {
    setDoc(findDocumentById(id) ?? null);
  }, [id]);

  if (doc === undefined) {
    return <Skeleton className="h-72 w-full rounded-xl" />;
  }

  if (doc === null) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Document not found.{" "}
          <Link href="/search" className="text-primary underline">
            Back to the E-Library
          </Link>
          .
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href="/search"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to the E-Library
      </Link>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-xs text-muted-foreground">
              {doc.referenceNo}
            </span>
            <Badge variant="outline">{doc.type}</Badge>
            <Badge variant="outline">{doc.category}</Badge>
            <StageBadge stage={doc.stage} />
            <OcrBadge status={doc.ocrStatus} />
          </div>
          <CardTitle className="font-heading text-2xl leading-tight">
            {doc.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Author(s)</dt>
              <dd>{authorNames(doc)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Filed</dt>
              <dd>{formatDate(doc.dateFiled)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Year</dt>
              <dd className="tabular-nums">{doc.year}</dd>
            </div>
            {doc.ocrConfidence !== undefined ? (
              <div>
                <dt className="text-muted-foreground">OCR confidence</dt>
                <dd>{formatConfidence(doc.ocrConfidence)}</dd>
              </div>
            ) : null}
          </dl>

          <Separator />
          <div>
            <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Summary
            </div>
            <p className="mt-1 text-sm">{doc.summary}</p>
          </div>

          <Separator />
          <div>
            <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Full text{doc.source === "scanned" ? " (OCR)" : ""}
            </div>
            <pre className="mt-1 max-h-96 overflow-auto rounded-lg border bg-muted/40 p-3 text-xs whitespace-pre-wrap">
              {documentBody(doc)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
