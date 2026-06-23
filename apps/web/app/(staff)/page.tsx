"use client";

import Link from "next/link";
import { CalendarClock, FileText, GitBranch, ScanLine, SearchCheck } from "lucide-react";
import { useSpConfig } from "@gelabs/sp/ui/client";

import { PageHeader } from "@/components/page-header";
import { Sparkline } from "@/components/sparkline";
import { cn } from "@/lib/utils";
import { OcrBadge, StageBadge } from "@/components/status-badges";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ACTIVE_STAGES, STAGE_META, formatDate, isActiveStage } from "@/lib/legislation";
import { authorNames } from "@/lib/reference-data";
import { useLegacyDocuments, useLegacySessions } from "@/hooks/data";

export default function DashboardPage() {
  const cfg = useSpConfig();
  const documents = useLegacyDocuments();
  const sessions = useLegacySessions();

  const totalDocs = documents.length;
  const activeMeasures = documents.filter((d) => isActiveStage(d.stage));
  const scanned = documents.filter((d) => d.source === "scanned");
  const ocrBacklog = scanned.filter((d) => d.ocrStatus !== "processed");
  const searchable = documents.filter((d) => d.fullTextAvailable);
  const searchablePct = totalDocs ? Math.round((searchable.length / totalDocs) * 100) : 0;

  const nextSession = sessions.filter((s) => s.status === "scheduled").sort((a, b) => a.date.localeCompare(b.date))[0];

  const pipeline = ACTIVE_STAGES.map((stage) => ({ stage, count: documents.filter((d) => d.stage === stage).length }));
  const maxPipeline = Math.max(1, ...pipeline.map((p) => p.count));

  const recent = [...documents].sort((a, b) => b.lastActionDate.localeCompare(a.lastActionDate)).slice(0, 6);

  const stats = [
    { label: "Total records", value: totalDocs, hint: `${scanned.length} digitized from scans`, icon: FileText, spark: [4, 6, 5, 8, 7, 9, 12], featured: false },
    { label: "Active measures", value: activeMeasures.length, hint: "in the legislative pipeline", icon: GitBranch, spark: [2, 3, 3, 5, 4, 6, 7], featured: true },
    { label: "OCR backlog", value: ocrBacklog.length, hint: "scanned docs awaiting / failed OCR", icon: ScanLine, spark: [5, 5, 4, 4, 3, 3, 2], featured: false },
    { label: "Full-text searchable", value: `${searchablePct}%`, hint: `${searchable.length} of ${totalDocs} records`, icon: SearchCheck, spark: [58, 63, 68, 72, 76, 80, 85], featured: false },
  ];

  return (
    <>
      <PageHeader title="Executive Dashboard" description={`Real-time overview of ${cfg.municipality.shortName}'s legislative records, pipeline, and sessions.`} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className={cn("gap-2", s.featured && "shadow-xl shadow-black/30 ring-1 ring-[#caa14a]/40 lg:-translate-y-2")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{s.label}</CardTitle>
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#caa14a]/20 text-[#e3c069]">
                <s.icon className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={cn("font-heading text-4xl font-bold tabular-nums", s.featured ? "text-[#e3c069]" : "text-foreground")}>{s.value}</div>
              <p className="mt-1 text-xs tracking-wide text-muted-foreground uppercase">{s.hint}</p>
              <Sparkline data={s.spark} className="mt-2 text-[#caa14a]" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Legislative pipeline</CardTitle>
            <CardDescription>Active measures by stage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pipeline.map((p) => (
              <div key={p.stage} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span>{STAGE_META[p.stage].label}</span>
                  <span className="tabular-nums text-muted-foreground">{p.count}</span>
                </div>
                <Progress value={(p.count / maxPipeline) * 100} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarClock className="size-4" /> Upcoming session</CardTitle>
            {nextSession ? <CardDescription className="capitalize">{formatDate(nextSession.date)} · {nextSession.mode}</CardDescription> : null}
          </CardHeader>
          <CardContent>
            {nextSession ? (
              <div className="space-y-3">
                <div className="font-medium">{nextSession.title}</div>
                <ol className="space-y-1.5 text-sm text-muted-foreground">
                  {nextSession.agenda.slice(0, 5).map((item) => (
                    <li key={item.id} className="flex gap-2"><span className="tabular-nums">{item.order}.</span><span>{item.title}</span></li>
                  ))}
                </ol>
              </div>
            ) : <p className="text-sm text-muted-foreground">No scheduled sessions.</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent legislative activity</CardTitle>
          <CardDescription>Most recently acted-upon records</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Stage</TableHead>
                <TableHead className="hidden lg:table-cell">Source</TableHead>
                <TableHead className="text-right">Last action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-mono text-xs whitespace-nowrap">
                    <Link href={`/documents/${doc.id}`} className="text-primary hover:underline">{doc.referenceNo}</Link>
                  </TableCell>
                  <TableCell className="max-w-[22rem]">
                    <Link href={`/documents/${doc.id}`} className="block truncate font-medium hover:text-primary hover:underline">{doc.title}</Link>
                    <div className="truncate text-xs text-muted-foreground">{authorNames(doc)}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell"><StageBadge stage={doc.stage} /></TableCell>
                  <TableCell className="hidden lg:table-cell"><OcrBadge status={doc.ocrStatus} /></TableCell>
                  <TableCell className="text-right text-sm whitespace-nowrap text-muted-foreground">{formatDate(doc.lastActionDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
