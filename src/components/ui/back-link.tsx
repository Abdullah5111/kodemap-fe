import Link from "next/link";
import { cn } from "@/lib/cn";

/** Prominent back-navigation button (pill, not a faint text link). */
export function BackLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-line-2 bg-elevated px-3 py-1.5 font-mono text-[12.5px] font-semibold text-ink-dim transition-colors hover:border-ember hover:bg-ember-soft hover:text-ember",
        className,
      )}
    >
      <span aria-hidden className="text-[15px] leading-none">&larr;</span>
      {children}
    </Link>
  );
}
