import { cn } from "@/lib/cn";

/** Compact pager for DRF page-number lists. Renders nothing when everything
    fits on a single page. `page` is 1-indexed. */
export function Pagination({
  page,
  pageSize,
  count,
  onChange,
  className,
}: {
  page: number;
  pageSize: number;
  count: number;
  onChange: (page: number) => void;
  className?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, count);
  const btn =
    "inline-flex items-center gap-1 rounded-lg border border-line-2 bg-elevated px-3 py-1.5 font-mono text-[12px] font-semibold text-ink-dim transition-colors enabled:hover:border-ember-line enabled:hover:text-ember disabled:opacity-40";

  return (
    <div className={cn("mt-3 flex flex-wrap items-center justify-between gap-3", className)}>
      <span className="font-mono text-[11.5px] tabular-nums text-ink-mute">
        {from}–{to} of {count}
      </span>
      <div className="flex items-center gap-2">
        <button type="button" className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          Prev
        </button>
        <span className="font-mono text-[12px] tabular-nums text-ink-dim">
          Page {page} / {totalPages}
        </span>
        <button type="button" className={btn} disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Next
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
