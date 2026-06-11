import type { Metadata } from "next";

import { DocumentScanner } from "@/components/document-scanner";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Scan & Digitize" };

export default function ScanPage() {
  return (
    <>
      <PageHeader
        title="Scan & Digitize"
        description="Scan a paper with in-browser OCR to create a searchable digital copy. Documents already on file are detected and opened automatically."
      />
      <DocumentScanner />
    </>
  );
}
