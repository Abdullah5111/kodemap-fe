import { cn } from "@/lib/cn";

/**
 * Brand logo. Two assets live in /public:
 *   - logo-mark.svg  → icon only (square)
 *   - logo-full.svg  → icon + "Kodemap" wordmark
 * Brand colors: ember #F65F2E + teal #257072.
 */

/** Icon-only mark. Square; size via className (defaults to size-8). */
export function LogoMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-mark.png"
      alt="Kodemap"
      className={cn("size-8 object-contain", className)}
      draggable={false}
    />
  );
}

/** Full lockup (icon + wordmark). Height via className (defaults to h-8). */
export function Logo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-full.png"
      alt="Kodemap"
      className={cn("h-8 w-auto object-contain", className)}
      draggable={false}
    />
  );
}
