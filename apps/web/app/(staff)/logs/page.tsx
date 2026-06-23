"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePagination } from "@/hooks/use-pagination";
import { adminFetch } from "@/api";

interface AuditRow {
  seq: number;
  at: string;
  actorId: string | null;
  actorName: string;
  actorRole: string | null;
  action: string;
  collection: string | null;
  docId: string | null;
  detail: unknown;
}

/** Friendlier labels for the raw mutation/admin action codes. */
const ACTION_LABEL: Record<string, string> = {
  create: "Created record",
  update: "Updated record",
  delete: "Deleted record",
  append: "Appended to record",
  "auth.login": "Signed in",
  "auth.fail": "Failed sign-in",
  "admin.account.create": "Created account",
  "admin.account.update": "Updated account",
  "admin.account.delete": "Deleted account",
  "admin.role.create": "Created role",
  "admin.role.update": "Updated role",
  "admin.role.delete": "Deleted role",
  "sync.resolve.keep_theirs": "Sync conflict — kept server version",
  "sync.resolve.use_mine": "Sync conflict — re-applied own change",
  "sync.resolve.acknowledged": "Sync rejection acknowledged",
};

/** Drop the `sp.` prefix and show the module.collection part. */
function collectionLabel(key: string | null): string {
  if (!key) return "—";
  return key.replace(/^sp\./, "");
}

function actionTone(action: string): "default" | "secondary" | "outline" | "destructive" {
  if (action.startsWith("delete") || action.endsWith(".delete") || action === "auth.fail") return "destructive";
  if (action.startsWith("create") || action.endsWith(".create")) return "default";
  return "secondary";
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function detailText(detail: unknown): string {
  if (detail == null) return "";
  if (typeof detail === "string") return detail;
  try {
    return JSON.stringify(detail);
  } catch {
    return "";
  }
}

export default function Logs() {
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/audit?limit=300");
      if (!res.ok) throw new Error(res.status === 403 ? "Restricted" : "Could not load logs");
      setRows((await res.json()) as AuditRow[]);
      setError(null);
    } catch (e) {
      setError(String((e as Error).message ?? e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.actorName, r.actorRole ?? "", r.action, r.collection ?? "", detailText(r.detail)]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [rows, query]);

  const pager = usePagination(filtered, 15);

  // Reset to the first page when the filter narrows the set.
  useEffect(() => {
    pager.setPage(1);
  }, [query, pager.setPage]);

  return (
    <>
      <PageHeader
        title="Activity Logs"
        description="Append-only, tamper-evident record of every action across the system — sign-ins, document and session changes, and account/role administration."
        actions={
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} /> Refresh
          </Button>
        }
      />

      {error ? (
        <div className="rounded-xl border bg-card p-12 text-center text-sm text-muted-foreground">
          Restricted — {error}
        </div>
      ) : rows === null ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="space-y-3">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Filter by user, action, or record…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">When</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="hidden md:table-cell">Record</TableHead>
                  <TableHead className="hidden lg:table-cell">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      {rows.length === 0 ? "No activity recorded yet." : "No entries match your filter."}
                    </TableCell>
                  </TableRow>
                ) : (
                  pager.pageItems.map((r) => (
                    <TableRow key={r.seq}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                        {formatWhen(r.at)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{r.actorName}</div>
                        {r.actorRole ? (
                          <div className="text-xs text-muted-foreground">{r.actorRole}</div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant={actionTone(r.action)} className="font-normal">
                          {ACTION_LABEL[r.action] ?? r.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
                        {collectionLabel(r.collection)}
                        {r.docId ? (
                          <span className="text-muted-foreground/70"> · {r.docId.slice(0, 8)}</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="hidden max-w-xs truncate text-xs text-muted-foreground lg:table-cell">
                        {detailText(r.detail)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Pagination
            page={pager.page}
            pageCount={pager.pageCount}
            total={pager.total}
            from={pager.from}
            to={pager.to}
            onPageChange={pager.setPage}
            noun="event"
          />
        </div>
      )}
    </>
  );
}
