import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { SessionDashboard } from "@/components/session-dashboard";

export const metadata: Metadata = { title: "Paperless Session Dashboard" };

export default function SessionsPage() {
  return (
    <>
      <PageHeader
        title="Paperless Session Dashboard"
        description="Run efficient, paperless Sanggunian sessions with a live Order of Business and in-session document viewer."
      />
      <SessionDashboard />
    </>
  );
}
