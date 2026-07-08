import { cn } from "@/lib/cn";

/**
 * Placeholder brand mark + wordmark. Swap `LogoMark` for the real asset when
 * the brand files land — the rest of the app just imports <Logo />.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-8 place-items-center rounded-[9px] border border-dashed border-line-2 bg-elevated text-ink-mute",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    </span>
  );
}

export function Logo({ chip }: { chip?: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="font-mono text-lg font-bold tracking-tight">
        kode<span className="text-ember">map</span>
      </span>
      {chip ? (
        <span className="rounded-md border border-ember-line bg-ember-soft px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-ember">
          {chip}
        </span>
      ) : null}
    </span>
  );
}
