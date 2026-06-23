"use client";

import { useState } from "react";
import {
  CheckCircle2,
  FileScan,
  Loader2,
  ScanLine,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { startInstance } from "@gelabs/sp/contracts";
import { formatConfidence } from "@/lib/legislation";
import { documents as docsCol } from "@/data";
import { toLegacyDoc } from "@/lib/adapt";
import { uuidv7, todayISO } from "@/store";
import type {
  DocumentType,
  LegislativeCategory,
  LegislativeDocument,
} from "@/types/legislation";

const REF_REGEX = /\b(ORD|RES|EO|CR)-\d{4}-\d{1,3}\b/i;

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

const fieldClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type Phase = "idle" | "scanning" | "done";

export function DocumentScanner() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [text, setText] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [duplicate, setDuplicate] = useState<LegislativeDocument | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [type, setType] = useState<DocumentType>("Ordinance");
  const [category, setCategory] = useState<LegislativeCategory>("General");
  const router = useRouter();

  const onPick = (f: File | null) => {
    if (!f) return;
    setFile(f);
    setImageUrl(URL.createObjectURL(f));
    setPhase("idle");
    setText("");
    setConfidence(null);
    setDuplicate(null);
  };

  const runOcr = async () => {
    if (!file) return;
    setPhase("scanning");
    setProgress(0);
    try {
      const Tesseract = await import("tesseract.js");
      const worker = await Tesseract.createWorker("eng", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });
      const { data } = await worker.recognize(file);
      await worker.terminate();

      const extracted = data.text ?? "";
      setText(extracted);
      setConfidence(
        typeof data.confidence === "number" ? data.confidence / 100 : null,
      );

      const match = extracted.match(REF_REGEX);
      if (match) {
        const ref = match[0].toUpperCase();
        setReferenceNo(ref);
        const existing = docsCol.all().find((d) => d.ref === ref);
        if (existing) setDuplicate(toLegacyDoc(existing));
      }
      setPhase("done");
    } catch (err) {
      console.error("OCR failed", err);
      setPhase("idle");
      window.alert("OCR failed — please try a clearer image.");
    }
  };

  const save = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle || saving) return;
    const ref = referenceNo.trim();
    // Client-side dedupe against the local cache; the OCR text rides in the
    // create mutation, so the scan is searchable the moment it syncs (offline-safe).
    const dup = ref ? docsCol.all().find((d) => d.ref === ref) : undefined;
    if (dup) { router.push(`/documents/${dup.id}`); return; }
    setSaving(true);
    const id = uuidv7();
    const hasText = text.trim().length > 0;
    docsCol.add({
      id, ref: ref || `SB-SCAN-${id.slice(0, 6)}`, title: cleanTitle,
      type, category, year: new Date().getFullYear(), dateFiled: todayISO(),
      summary: text.slice(0, 240), stage: "filed", authors: [],
      source: "scanned", ocrStatus: hasText ? "processed" : "failed",
      ocrConfidence: confidence ?? 0, fullTextAvailable: hasText, extractedText: text,
      wf: startInstance("legislation"),
    });
    router.push(`/documents/${id}`);
  };

  const reset = () => {
    setImageUrl(null);
    setFile(null);
    setPhase("idle");
    setProgress(0);
    setText("");
    setConfidence(null);
    setDuplicate(null);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Capture + OCR */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanLine className="size-4" /> Scan a document
          </CardTitle>
          <CardDescription>
            Upload or photograph a paper — OCR runs entirely in your browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {imageUrl ? (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-lg border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Scanned page preview"
                  className="max-h-80 w-full object-contain"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={runOcr} disabled={phase === "scanning"}>
                  {phase === "scanning" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Scanning…{" "}
                      {progress}%
                    </>
                  ) : (
                    <>
                      <FileScan className="size-4" /> Extract text
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={reset}>
                  <X className="size-4" /> Clear
                </Button>
              </div>
              {phase === "scanning" ? <Progress value={progress} /> : null}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-accent">
                <Upload className="size-6" />
                <span>Click to upload an image of the paper</span>
                <span className="text-xs">PNG / JPG — or use your camera on mobile</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPick(e.target.files?.[0] ?? null)}
                />
              </label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors hover:bg-accent sm:hidden">
                <ScanLine className="size-4" /> Use camera
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => onPick(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Digital copy + dedupe + save */}
      <Card>
        <CardHeader>
          <CardTitle>Digital copy</CardTitle>
          <CardDescription>
            {phase === "done"
              ? "Review the extracted text, name it, and save."
              : "Extracted text and details will appear here."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {duplicate ? (
            <div className="rounded-lg border border-primary bg-primary/5 p-3 text-sm">
              <div className="font-medium">This document already exists.</div>
              <p className="mt-1 text-muted-foreground">
                Matched{" "}
                <span className="font-mono">{duplicate.referenceNo}</span> —{" "}
                {duplicate.title}.
              </p>
              <Button
                className="mt-2"
                size="sm"
                onClick={() => router.push(`/documents/${duplicate.id}`)}
              >
                Open existing document
              </Button>
            </div>
          ) : null}

          {phase === "done" || text ? (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Extracted text
                  {confidence !== null ? (
                    <span className="ml-1 normal-case">
                      · OCR confidence {formatConfidence(confidence)}
                    </span>
                  ) : null}
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={6}
                  className={`${fieldClass} h-auto py-2 font-mono text-xs`}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="doc-title" className="text-sm font-medium">
                    Document name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="doc-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Anti-Noise Ordinance of Santa Cruz"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="doc-ref" className="text-sm font-medium">
                    Reference no.
                  </label>
                  <Input
                    id="doc-ref"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder="ORD-2025-001"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Type</label>
                  <select
                    aria-label="Document type"
                    value={type}
                    onChange={(e) => setType(e.target.value as DocumentType)}
                    className={fieldClass}
                  >
                    {DOCUMENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Category</label>
                  <select
                    aria-label="Category"
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as LegislativeCategory)
                    }
                    className={fieldClass}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Button onClick={save} disabled={!title.trim() || saving}>
                <CheckCircle2 className="size-4" />{" "}
                {saving ? "Saving…" : "Save digital copy"}
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Upload a document and click <strong>Extract text</strong> to
              begin.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
