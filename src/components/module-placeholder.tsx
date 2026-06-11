import { CircleDashed } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface PlannedFeature {
  title: string;
  description: string;
}

export function ModulePlaceholder({
  phase,
  features,
}: {
  phase: string;
  features: PlannedFeature[];
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base">Planned capabilities</CardTitle>
            <CardDescription>
              This module is scaffolded but not yet built. Below is what it will deliver.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {phase}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {features.map((f) => (
          <div key={f.title} className="rounded-lg border p-4">
            <div className="flex items-center gap-2 font-medium">
              <CircleDashed className="size-4 text-muted-foreground" />
              {f.title}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
