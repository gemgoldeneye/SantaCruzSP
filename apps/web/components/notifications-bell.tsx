import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

import { AttentionItems, useAttentionCount } from "@/components/attention-items";
import { api, type NotificationRow } from "@/api";
import { describeNotification, relativeTime } from "@/lib/notifications";
import { cn } from "@/lib/utils";

const LS_KEY = "sp.notif.lastSeen";

export function NotificationsBell() {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<number>(() => Number(localStorage.getItem(LS_KEY) ?? 0));
  // Threshold for the "new" dot while the panel is open (frozen at open time).
  const [highlightBelow, setHighlightBelow] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const rows = await api.notifications(40);
        if (alive) setItems(rows);
      } catch {
        /* offline / unauthorized — leave the last list in place */
      }
    };
    void load();
    const id = setInterval(() => void load(), 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const attnCount = useAttentionCount();
  const maxSeq = items[0]?.seq ?? 0;
  const unread = items.filter((n) => n.seq > seen).length;
  // Unsynced/rejected edits are always urgent — always part of the badge.
  const badge = unread + attnCount;

  const toggle = () => {
    if (!open && maxSeq > seen) {
      setHighlightBelow(seen);
      setSeen(maxSeq);
      localStorage.setItem(LS_KEY, String(maxSeq));
    }
    setOpen((o) => !o);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        title="Notifications"
        aria-label={badge > 0 ? `${badge} notifications need attention` : "Notifications"}
        className="relative hidden rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white sm:block"
      >
        <Bell className="size-4" />
        {badge > 0 ? (
          <span className="absolute top-0.5 right-0.5 flex min-w-4 items-center justify-center rounded-full bg-[#b51d2b] px-1 text-[10px] font-semibold text-white tabular-nums">
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          {/* click-away backdrop */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <span className="text-sm font-semibold">Notifications</span>
              <span className="text-xs text-muted-foreground">Important activity</span>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {/* Unsynced/rejected edits surfaced as actionable tasks — never silently dropped. */}
              <AttentionItems />
              {items.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No notifications yet.
                </p>
              ) : (
                items.slice(0, 12).map((n) => {
                  const { icon: Icon, label, subject } = describeNotification(n);
                  const isNew = n.seq > highlightBelow;
                  return (
                    <div
                      key={n.seq}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent",
                        isNew && "bg-primary/5",
                      )}
                    >
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium">{label}</span>
                          {isNew ? <span className="size-1.5 rounded-full bg-[#b51d2b]" /> : null}
                        </div>
                        {subject ? (
                          <div className="truncate text-xs text-muted-foreground">{subject}</div>
                        ) : null}
                        <div className="mt-0.5 text-[11px] text-muted-foreground/80">
                          {n.actorName} · {relativeTime(n.at)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block border-t px-4 py-2.5 text-center text-xs font-medium text-primary hover:bg-accent"
            >
              View all notifications
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
