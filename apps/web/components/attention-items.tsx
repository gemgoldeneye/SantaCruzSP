import { AlertTriangle } from "lucide-react";
import {
  acknowledge,
  actionsFor,
  resolveKeepTheirs,
  resolveUseMine,
  useAttentionItems,
} from "@gelabs/sp/sync-client";

import { Button } from "@/components/ui/button";

/** Plain-English explanation per rejection code. */
const ATTN_COPY: Record<string, string> = {
  version_conflict: "Someone else updated this while you were offline.",
  step_already_actioned: "Someone already actioned this step — your action wasn't applied.",
  validation_failed: "Your offline change wasn't accepted. Open the record and fix it.",
  permission_denied: "You don't have permission for this change.",
  not_found: "This record no longer exists in the system.",
};

const BTN_LABEL: Record<"keepTheirs" | "useMine" | "ok", string> = {
  keepTheirs: "Keep saved version",
  useMine: "Use my change",
  ok: "Dismiss",
};

function subjectOf(item: { payload?: unknown; collection: string }): string {
  const p = item.payload as { title?: string; ref?: string } | undefined;
  return p?.ref ?? p?.title ?? item.collection.replace(/^sp\./, "");
}

/** Reactive count of open sync rejections — drives the bell badge. */
export function useAttentionCount(): number {
  return useAttentionItems().length;
}

/**
 * Surfaces rejected/conflicting offline edits as actionable tasks (instead of
 * silently discarding them). Each resolution adopts the server's copy, re-issues
 * the user's change, or acknowledges — and is recorded in the server audit trail.
 */
export function AttentionItems() {
  const items = useAttentionItems();
  if (items.length === 0) return null;

  return (
    <div className="border-b bg-amber-500/10">
      <div className="flex items-center gap-1.5 px-4 pt-2.5 pb-1 text-xs font-semibold text-amber-700 dark:text-amber-500">
        <AlertTriangle className="size-3.5" /> Needs your attention
      </div>
      {items.map((item) => (
        <div key={item.id} className="px-4 py-2.5">
          <div className="text-sm">
            {ATTN_COPY[item.code] ?? "An offline change couldn't be saved."}
          </div>
          <div className="truncate text-xs text-muted-foreground">{subjectOf(item)}</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {actionsFor(item).map((a, i) => (
              <Button
                key={a}
                size="sm"
                variant={i === 0 ? "default" : "outline"}
                onClick={() => {
                  if (a === "keepTheirs") void resolveKeepTheirs(item);
                  else if (a === "useMine") void resolveUseMine(item);
                  else void acknowledge(item);
                }}
              >
                {BTN_LABEL[a]}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
