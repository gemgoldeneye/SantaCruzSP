import { CheckCircle2, FileText, Gavel, ScanLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { COMMITTEES, DOCUMENTS } from "@/lib/mock-data";

function BarChart({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-2.5">
      {items.map((i) => (
        <div key={i.label} className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate">{i.label}</span>
            <span className="tabular-nums text-muted-foreground">{i.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(i.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const REPORTS = [
  {
    title: "Enacted measures by committee",
    description:
      "Summary of enacted ordinances and resolutions grouped by standing committee.",
  },
  {
    title: "OCR backlog report",
    description:
      "Scanned records pending or failed OCR, for Secretariat follow-up.",
  },
  {
    title: "Voting summary",
    description: "Roll-call outcomes across recorded sessions.",
  },
  {
    title: "Annual legislative output",
    description: "Measures filed and enacted per year.",
  },
];

export function AnalyticsOverview() {
  const total = DOCUMENTS.length;
  const scanned = DOCUMENTS.filter((d) => d.source === "scanned");
  const digital = total - scanned.length;
  const ocrProcessed = scanned.filter((d) => d.ocrStatus === "processed").length;
  const ocrInProgress = scanned.filter(
    (d) => d.ocrStatus === "pending" || d.ocrStatus === "processing",
  ).length;
  const ocrFailed = scanned.filter((d) => d.ocrStatus === "failed").length;
  const digitizationRate = scanned.length
    ? Math.round((ocrProcessed / scanned.length) * 100)
    : 0;

  const pendingApprovals = DOCUMENTS.filter(
    (d) => d.stage === "transmitted",
  ).length;
  const enacted = DOCUMENTS.filter(
    (d) => d.stage === "enacted" || d.stage === "approved",
  ).length;

  const categories = Array.from(new Set(DOCUMENTS.map((d) => d.category)));
  const byCategory = categories
    .map((c) => ({ label: c, value: DOCUMENTS.filter((d) => d.category === c).length }))
    .sort((a, b) => b.value - a.value);

  const byCommittee = COMMITTEES.map((c) => ({
    label: c.name.replace(/^Committee on /, ""),
    value: DOCUMENTS.filter((d) => d.committeeId === c.id).length,
  })).sort((a, b) => b.value - a.value);

  const byYear = Array.from(new Set(DOCUMENTS.map((d) => d.year)))
    .sort((a, b) => a - b)
    .map((y) => ({ label: String(y), value: DOCUMENTS.filter((d) => d.year === y).length }));

  const stats = [
    { label: "Total records", value: total, hint: `${digital} digital · ${scanned.length} scanned`, icon: FileText },
    { label: "Pending approval", value: pendingApprovals, hint: "transmitted to the Mayor", icon: Gavel },
    { label: "Approved / enacted", value: enacted, hint: "measures in force", icon: CheckCircle2 },
    { label: "Digitization rate", value: `${digitizationRate}%`, hint: `${ocrProcessed}/${scanned.length} scanned OCR-processed`, icon: ScanLine },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-heading text-3xl font-semibold tabular-nums">
                {s.value}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Measures by category</CardTitle>
            <CardDescription>Where legislative effort is concentrated</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart items={byCategory} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Committee productivity</CardTitle>
            <CardDescription>Measures referred per standing committee</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart items={byCommittee} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Records by year</CardTitle>
            <CardDescription>Archive depth, including digitized historical records</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart items={byYear} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>OCR &amp; digitization</CardTitle>
            <CardDescription>Scanned-archive processing status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Born-digital</span>
              <span className="tabular-nums">{digital}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Scanned (total)</span>
              <span className="tabular-nums">{scanned.length}</span>
            </div>
            <Separator />
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span>Digitization rate</span>
                <span className="tabular-nums">{digitizationRate}%</span>
              </div>
              <Progress value={digitizationRate} />
              <p className="text-xs text-muted-foreground">
                {ocrProcessed} processed · {ocrInProgress} in progress ·{" "}
                {ocrFailed} failed
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Secretariat reports</CardTitle>
          <CardDescription>
            One-click exports for the Secretariat (generation wired with the backend)
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {REPORTS.map((r) => (
            <div
              key={r.title}
              className="flex items-start justify-between gap-3 rounded-lg border p-4"
            >
              <div>
                <div className="font-medium">{r.title}</div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {r.description}
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Generate
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
