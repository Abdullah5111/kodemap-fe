import { cn } from "@/lib/cn";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block size-4 animate-spin rounded-full border-2 border-line border-t-ember",
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-16 text-ink-mute">
      <Spinner />
      <span className="font-mono text-sm">{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-bad/40 bg-bad-soft px-4 py-4 text-[13px] text-bad">
      {message}
      {onRetry ? (
        <button type="button" onClick={onRetry} className="ml-2 font-semibold underline">
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line-2 bg-surface px-6 py-14 text-center">
      <p className="font-semibold text-ink">{title}</p>
      {description ? <p className="max-w-[42ch] text-[13px] text-ink-dim">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
