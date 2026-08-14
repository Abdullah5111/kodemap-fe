import { cn } from "@/lib/cn";

/**
 * Prominent, consistent page header used across the app.
 * A gradient eyebrow, an oversized bold title, an optional description, and an
 * optional right-side action slot.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ember">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1.5 text-[clamp(24px,3.4vw,32px)] font-extrabold leading-[1.08] tracking-tight">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-[62ch] text-[14px] text-ink-dim">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-shrink-0 gap-2">{actions}</div> : null}
    </div>
  );
}

/** Section heading with a gradient accent bar. */
export function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("flex items-center gap-2.5 text-[16px] font-bold", className)}>
      <span className="bg-brand-grad h-4 w-1 rounded-full" />
      {children}
    </h2>
  );
}
