import { Badge } from "@/components/ui/badge";
import { OCR_META, STAGE_META } from "@/lib/legislation";
import type { LegislativeStage, OcrStatus } from "@/types/legislation";

export function StageBadge({
  stage,
  short = true,
}: {
  stage: LegislativeStage;
  short?: boolean;
}) {
  const meta = STAGE_META[stage];
  return <Badge variant={meta.tone}>{short ? meta.short : meta.label}</Badge>;
}

export function OcrBadge({ status }: { status: OcrStatus }) {
  const meta = OCR_META[status];
  return <Badge variant={meta.tone}>{meta.label}</Badge>;
}
