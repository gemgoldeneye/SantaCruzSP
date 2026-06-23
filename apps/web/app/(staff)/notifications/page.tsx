"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, RefreshCw } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { usePagination } from "@/hooks/use-pagination";
import { api, type NotificationRow } from "@/api";
import { describeNotification, formatFullTime } from "@/lib/notifications";
import { cn } from "@/lib/utils";

const FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "sp.sanggunian.documents", label: "Documents" },
  { value: "sp.sanggunian.sessions", label: "Sessions" },
  { value: "sp.mtop.applications", label: "Applications" },
  { value: "sp.mtop.mtops", label: "MTOPs" },
  { value: "sp.portal.feedback", label: "Feedback" },
];

export default function Notifications() {
  const [rows, setRows] = useState<NotificationRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      setRows(await api.notifications(200));
      setError(null);
    } catch (e) {
      setError(String((e as { message?: string }).message ?? e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(
    () => (rows ?? []).filter((n) => filter === "all" || n.collection === filter),
    [rows, filter],
  );

  const pager = usePagination(filtered, 15);

  useEffect(() => {
    pager.setPage(1);
  }, [filter, pager.setPage]);

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Important activity across the apps — new documents, sessions, franchise applications, MTOPs, and citizen feedback. For the complete audit trail, see Activity Logs."
        actions={
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} /> Refresh
          </Button>
        }
      />

      {error ? (
        <div className="rounded-xl border bg-card p-12 text-center text-sm text-muted-foreground">
          Could not load notifications — {error}
        </div>
      ) : rows === null ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="space-y-3">
          {/* type filter */}
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  filter === f.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="divide-y rounded-xl border bg-card">
            {filtered.length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">
                No notifications{filter === "all" ? " yet" : " in this category"}.
              </p>
            ) : (
              pager.pageItems.map((n) => {
                const { icon: Icon, label, subject, href } = describeNotification(n);
                const body = (
                  <>
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{label}</div>
                      {subject ? (
                        <div className="truncate text-sm text-muted-foreground">{subject}</div>
                      ) : null}
                      <div className="mt-1 text-xs text-muted-foreground/80">
                        {n.actorName}
                        {n.actorRole ? ` · ${n.actorRole}` : ""} · {formatFullTime(n.at)}
                      </div>
                    </div>
                    {href ? <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" /> : null}
                  </>
                );
                return href ? (
                  <Link
                    key={n.seq}
                    href={href}
                    className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent"
                  >
                    {body}
                  </Link>
                ) : (
                  <div key={n.seq} className="flex items-start gap-3 px-4 py-3">
                    {body}
                  </div>
                );
              })
            )}
          </div>

          <Pagination
            page={pager.page}
            pageCount={pager.pageCount}
            total={pager.total}
            from={pager.from}
            to={pager.to}
            onPageChange={pager.setPage}
            noun="notification"
          />
        </div>
      )}
    </>
  );
}
