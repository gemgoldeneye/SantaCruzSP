import { useMemo } from "react";
import { CheckCircle2, Download, FileText, Gavel, ScanLine } from "lucide-react";

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
import { useLegacyDocuments } from "@/hooks/data";
import { allCommittees } from "@/lib/reference-data";
import type { LegislativeDocument } from "@/types/legislation";

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
            <div className="h-full rounded-full bg-primary" style={{ width: `${(i.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
      {items.length === 0 ? <div className="text-sm text-muted-foreground">No data.</div> : null}
    </div>
  );
}

function groupBy(items: LegislativeDocument[], key: (d: LegislativeDocument) => string) {
  const m = new Map<string, number>();
  for (const d of items) { const k = key(d); m.set(k, (m.get(k) ?? 0) + 1); }
  return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

function toCsv(rows: string[][]): string {
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
}
function download(name: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export function AnalyticsOverview() {
  const docs = useLegacyDocuments();
  const committeeName = (id?: string) => allCommittees().find((c) => c.id === id)?.name ?? "No committee";

  const summary = useMemo(() => {
    const scanned = docs.filter((d) => d.source === "scanned");
    const ocrProcessed = scanned.filter((d) => d.ocrStatus === "processed").length;
    const ocrInProgress = scanned.filter((d) => d.ocrStatus === "pending" || d.ocrStatus === "processing").length;
    const ocrFailed = scanned.filter((d) => d.ocrStatus === "failed").length;
    return {
      total: docs.length,
      digital: docs.length - scanned.length,
      scannedCount: scanned.length,
      ocrProcessed, ocrInProgress, ocrFailed,
      digitizationRate: scanned.length ? Math.round((ocrProcessed / scanned.length) * 100) : 0,
      pendingApprovals: docs.filter((d) => d.stage === "transmitted").length,
      enacted: docs.filter((d) => d.stage === "approved" || d.stage === "enacted").length,
      byCategory: groupBy(docs, (d) => d.category),
      byCommittee: groupBy(docs.filter((d) => d.committeeId), (d) => committeeName(d.committeeId)),
      byYear: groupBy(docs, (d) => String(d.year)).sort((a, b) => a.label.localeCompare(b.label)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docs]);

  const {
    total, digital, scannedCount, ocrProcessed, ocrInProgress, ocrFailed,
    digitizationRate, pendingApprovals, enacted, byCategory, byCommittee, byYear,
  } = summary;

  const stats = [
    { label: "Total records", value: total, hint: `${digital} digital · ${scannedCount} scanned`, icon: FileText },
    { label: "Pending approval", value: pendingApprovals, hint: "transmitted to the Mayor", icon: Gavel },
    { label: "Approved / enacted", value: enacted, hint: "measures in force", icon: CheckCircle2 },
    { label: "Digitization rate", value: `${digitizationRate}%`, hint: `${ocrProcessed}/${scannedCount} scanned OCR-processed`, icon: ScanLine },
  ];

  const REPORTS = [
    { key: "enacted-by-committee", title: "Enacted measures by committee", description: "Enacted ordinances and resolutions grouped by standing committee.", rows: () => [["Committee", "Count"], ...byCommittee.map((b) => [b.label, String(b.value)])] },
    { key: "ocr-backlog", title: "OCR backlog report", description: "Scanned records pending or failed OCR, for Secretariat follow-up.", rows: () => [["Reference", "Title", "OCR"], ...docs.filter((d) => d.source === "scanned" && d.ocrStatus !== "processed").map((d) => [d.referenceNo, d.title, d.ocrStatus])] },
    { key: "voting-summary", title: "Voting summary", description: "Roll-call outcomes across recorded sessions.", rows: () => [["Reference", "Stage", "Year"], ...docs.map((d) => [d.referenceNo, d.stage, String(d.year)])] },
    { key: "annual-output", title: "Annual legislative output", description: "Measures filed and enacted per year.", rows: () => [["Year", "Records"], ...byYear.map((b) => [b.label, String(b.value)])] },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-heading text-3xl font-semibold tabular-nums">{s.value}</div>
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
          <CardContent><BarChart items={byCategory} /></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Committee productivity</CardTitle>
            <CardDescription>Measures referred per standing committee</CardDescription>
          </CardHeader>
          <CardContent><BarChart items={byCommittee} /></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Records by year</CardTitle>
            <CardDescription>Archive depth, including digitized historical records</CardDescription>
          </CardHeader>
          <CardContent><BarChart items={byYear} /></CardContent>
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
              <span className="tabular-nums">{scannedCount}</span>
            </div>
            <Separator />
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span>Digitization rate</span>
                <span className="tabular-nums">{digitizationRate}%</span>
              </div>
              <Progress value={digitizationRate} />
              <p className="text-xs text-muted-foreground">
                {ocrProcessed} processed · {ocrInProgress} in progress · {ocrFailed} failed
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Secretariat reports</CardTitle>
          <CardDescription>One-click CSV exports generated live from the local records (works offline).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {REPORTS.map((r) => (
            <div key={r.key} className="flex items-start justify-between gap-3 rounded-lg border p-4">
              <div>
                <div className="font-medium">{r.title}</div>
                <p className="mt-0.5 text-sm text-muted-foreground">{r.description}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => download(`${r.key}.csv`, toCsv(r.rows()))}>
                <Download /> Export CSV
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
