"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ScanLine, Search, X } from "lucide-react";

import { OcrBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAllDocuments } from "@/lib/documents-store";
import { formatConfidence } from "@/lib/legislation";
import { DOCUMENTS, authorNames } from "@/lib/mock-data";
import type { DocumentType, LegislativeCategory } from "@/types/legislation";

const ALL = "all";

const DOCUMENT_TYPES: DocumentType[] = [
  "Ordinance",
  "Resolution",
  "Committee Report",
  "Draft Resolution",
  "Executive Order",
  "Minutes",
];

const CATEGORIES: LegislativeCategory[] = [
  "Environment",
  "Agriculture",
  "Tourism",
  "Budget",
  "Health",
  "Education",
  "Infrastructure",
  "Peace & Order",
  "General",
];

const YEARS = Array.from(new Set(DOCUMENTS.map((d) => d.year))).sort(
  (a, b) => b - a,
);

const selectClass =
  "h-9 cursor-pointer rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function SearchExplorer() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string>(ALL);
  const [category, setCategory] = useState<string>(ALL);
  const [year, setYear] = useState<string>(ALL);
  const [source, setSource] = useState<string>(ALL);

  const documents = useAllDocuments();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents.filter((d) => {
      if (type !== ALL && d.type !== type) return false;
      if (category !== ALL && d.category !== category) return false;
      if (year !== ALL && String(d.year) !== year) return false;
      if (source !== ALL && d.source !== source) return false;
      if (!q) return true;
      const haystack = [
        d.referenceNo,
        d.title,
        d.summary,
        d.category,
        authorNames(d),
        d.extractedText ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [documents, query, type, category, year, source]);

  const hasFilters =
    query !== "" ||
    type !== ALL ||
    category !== ALL ||
    year !== ALL ||
    source !== ALL;

  const reset = () => {
    setQuery("");
    setType(ALL);
    setCategory(ALL);
    setYear(ALL);
    setSource(ALL);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
        <ScanLine className="mt-0.5 size-4 shrink-0" />
        <p>
          Full-text search covers <strong>born-digital</strong> records and{" "}
          <strong>OCR-processed</strong> scanned documents. Records whose OCR
          failed are findable by metadata only and are flagged in the results.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by reference no., title, summary, or author…"
              className="pl-9"
              aria-label="Search legislative records"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter by document type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={selectClass}
            >
              <option value={ALL}>All types</option>
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={selectClass}
            >
              <option value={ALL}>All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className={selectClass}
            >
              <option value={ALL}>All years</option>
              {YEARS.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className={selectClass}
            >
              <option value={ALL}>All sources</option>
              <option value="digital">Born-digital</option>
              <option value="scanned">Scanned</option>
            </select>
            {hasFilters ? (
              <Button variant="ghost" size="sm" onClick={reset}>
                <X className="size-4" /> Clear
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground tabular-nums">
          {results.length}
        </span>{" "}
        {results.length === 1 ? "record" : "records"} found
      </p>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead className="hidden lg:table-cell">Category</TableHead>
              <TableHead className="hidden sm:table-cell">Year</TableHead>
              <TableHead>Source / OCR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No records match your search.
                </TableCell>
              </TableRow>
            ) : (
              results.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-mono text-xs whitespace-nowrap">
                    <Link
                      href={`/documents/${doc.id}`}
                      className="text-primary hover:underline"
                    >
                      {doc.referenceNo}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[24rem]">
                    <Link
                      href={`/documents/${doc.id}`}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {doc.title}
                    </Link>
                    <div className="truncate text-xs text-muted-foreground">
                      {authorNames(doc)}
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-sm md:table-cell">
                    {doc.type}
                  </TableCell>
                  <TableCell className="hidden text-sm lg:table-cell">
                    {doc.category}
                  </TableCell>
                  <TableCell className="hidden text-sm tabular-nums sm:table-cell">
                    {doc.year}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <OcrBadge status={doc.ocrStatus} />
                      {doc.source === "scanned" &&
                      doc.ocrStatus === "processed" &&
                      doc.ocrConfidence !== undefined ? (
                        <span className="text-xs text-muted-foreground">
                          OCR confidence {formatConfidence(doc.ocrConfidence)}
                        </span>
                      ) : null}
                      {!doc.fullTextAvailable ? (
                        <span className="text-xs text-destructive">
                          Metadata-only (no full text)
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
