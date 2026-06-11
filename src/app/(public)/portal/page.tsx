import type { Metadata } from "next";

import { CitizenPortal } from "@/components/citizen-portal";

export const metadata: Metadata = { title: "Transparency Portal" };

export default function PortalPage() {
  return <CitizenPortal />;
}
