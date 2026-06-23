import { useMemo, useState } from "react";

export interface Pagination<T> {
  /** The clamped current page (1-based). */
  page: number;
  setPage: (page: number) => void;
  /** Total number of pages (≥ 1). */
  pageCount: number;
  /** Items belonging to the current page. */
  pageItems: T[];
  /** 1-based index of the first item shown (0 when empty). */
  from: number;
  /** 1-based index of the last item shown. */
  to: number;
  /** Total item count across all pages. */
  total: number;
}

/**
 * Client-side pagination over an in-memory list. The page is clamped to the
 * valid range on every render, so shrinking the list (e.g. after filtering)
 * never strands the user on an empty page — no effects, no flicker.
 */
export function usePagination<T>(items: T[], pageSize = 10): Pagination<T> {
  const [page, setPage] = useState(1);
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);

  const pageItems = useMemo(
    () => items.slice((current - 1) * pageSize, current * pageSize),
    [items, current, pageSize],
  );

  return {
    page: current,
    setPage,
    pageCount,
    pageItems,
    from: total === 0 ? 0 : (current - 1) * pageSize + 1,
    to: Math.min(current * pageSize, total),
    total,
  };
}
