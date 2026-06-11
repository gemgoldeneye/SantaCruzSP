import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { SearchExplorer } from "@/components/search-explorer";

export const metadata: Metadata = { title: "Smart Search & E-Library" };

export default function SearchPage() {
  return (
    <>
      <PageHeader
        title="Smart Search & E-Library"
        description="OCR-powered full-text search across digital and scanned legislative records."
      />
      <SearchExplorer />
    </>
  );
}
