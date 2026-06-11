import { useEffect, useState } from "react";

import { DOCUMENTS } from "@/lib/mock-data";
import type { LegislativeDocument } from "@/types/legislation";

/**
 * Client-side document store (no backend yet). Saved scans live in localStorage
 * and are merged with the static sample library so they show up in search and
 * have a detail page. Swap for a real API later — the selectors are the seam.
 */
const STORAGE_KEY = "santacruz-sanggunian:scanned-docs";
const CHANGED_EVENT = "santacruz-docs-changed";

/** Scanned docs the user saved (client-only), newest first. */
export function getSavedDocuments(): LegislativeDocument[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LegislativeDocument[]) : [];
  } catch {
    return [];
  }
}

/** Saved scans + the static sample library. */
export function getAllDocuments(): LegislativeDocument[] {
  return [...getSavedDocuments(), ...DOCUMENTS];
}

export function saveDocument(doc: LegislativeDocument): void {
  if (typeof window === "undefined") return;
  const next = [doc, ...getSavedDocuments()];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

export function findByReference(ref: string): LegislativeDocument | undefined {
  const r = normalize(ref);
  if (!r) return undefined;
  return getAllDocuments().find((d) => normalize(d.referenceNo) === r);
}

export function findByTitle(title: string): LegislativeDocument | undefined {
  const t = normalize(title);
  if (!t) return undefined;
  return getAllDocuments().find((d) => normalize(d.title) === t);
}

export function findDocumentById(id: string): LegislativeDocument | undefined {
  return getAllDocuments().find((d) => d.id === id);
}

/** Reactive list of all documents (static + saved scans) for client components. */
export function useAllDocuments(): LegislativeDocument[] {
  const [docs, setDocs] = useState<LegislativeDocument[]>(DOCUMENTS);
  useEffect(() => {
    const refresh = () => setDocs(getAllDocuments());
    refresh();
    window.addEventListener(CHANGED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(CHANGED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return docs;
}
