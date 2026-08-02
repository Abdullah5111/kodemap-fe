import { cn } from "@/lib/cn";
import { LogoMark } from "./logo";

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

/** Branded loader: a two-tone (ember + teal) ring sweeping around the logo mark. */
export function BrandLoader({ className }: { className?: string }) {
  return (
    <span
      className={cn("relative grid size-16 place-items-center", className)}
      role="status"
      aria-label="Loading"
    >
      <span className="absolute inset-0 animate-spin rounded-full border-[2.5px] border-transparent border-t-ember border-b-tan [animation-duration:0.9s]" />
      <LogoMark className="size-9" />
    </span>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <BrandLoader />
      {label ? (
        <span className="font-mono text-[13px] tracking-wide text-ink-mute">{label}</span>
      ) : null}
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
