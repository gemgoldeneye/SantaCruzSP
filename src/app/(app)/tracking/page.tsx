import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { TrackingBoard } from "@/components/tracking-board";

export const metadata: Metadata = { title: "Legislative Tracking & Workflow" };

export default function TrackingPage() {
  return (
    <>
      <PageHeader
        title="Legislative Tracking & Workflow"
        description="See exactly where every proposed measure stands — by stage, committee, and recorded votes."
      />
      <TrackingBoard />
    </>
  );
}
