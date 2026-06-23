import type { Metadata } from "next";

import { PrangkisaModule } from "@/components/prangkisa/prangkisa-module";

export const metadata: Metadata = { title: "Tricycle Franchising & MTOP" };

export default function PrangkisaPage() {
  return <PrangkisaModule />;
}
