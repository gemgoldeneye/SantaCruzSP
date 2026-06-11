import type { Metadata } from "next";

import { AnalyticsOverview } from "@/components/analytics-overview";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Data Analytics & Secretariat Reports" };

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader
        title="Data Analytics & Secretariat Reports"
        description="Measure the Sanggunian's performance and track Secretariat document processing."
      />
      <AnalyticsOverview />
    </>
  );
}
