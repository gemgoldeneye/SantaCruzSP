import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  page: number;
  pageCount: number;
  total: number;
  from: number;
  to: number;
  onPageChange: (page: number) => void;
  /** Noun for the count label, e.g. "record" → "Showing 1–10 of 42 records". */
  noun?: string;
  className?: string;
}

/** Compact pager: a count label + Prev / Next. Renders nothing while a single
 *  page (or no data) fits, so short lists stay clean. */
export function Pagination({
  page,
  pageCount,
  total,
  from,
  to,
  onPageChange,
  noun = "item",
  className,
}: PaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <div
      className={cn(
        "flex flex-col-reverse items-center justify-between gap-3 sm:flex-row",
        className,
      )}
    >
      <p className="text-xs text-muted-foreground tabular-nums">
        Showing {from}–{to} of {total} {total === 1 ? noun : `${noun}s`}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4" /> Prev
        </Button>
        <span className="px-2 text-xs text-muted-foreground tabular-nums">
          Page {page} of {pageCount}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Next <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
