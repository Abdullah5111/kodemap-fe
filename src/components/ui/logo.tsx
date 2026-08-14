import { cn } from "@/lib/cn";

/**
 * Brand logo. Four assets live in /public:
 *   logo-main.png       → icon only, gradient (ember → maroon)
 *   logo-white.png      → icon only, white (for placing on the gradient/ember)
 *   logo-full-main.png  → icon + KODEMAP wordmark, gradient
 *   logo-full-white.png → icon + KODEMAP wordmark, white
 * The gradient variant reads on both the near-black and the light ground, so it's
 * the default; use variant="white" only when the logo sits on a colored surface.
 */

type Variant = "main" | "white";

/** Icon-only mark. Square; size via className (defaults to size-8). */
export function LogoMark({
  className,
  variant = "main",
}: {
  className?: string;
  variant?: Variant;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={variant === "white" ? "/logo-white.png" : "/logo-main.png"}
      alt="Kodemap"
      className={cn("size-8 object-contain", className)}
      draggable={false}
    />
  );
}

/** Full lockup (icon + wordmark). Height via className (defaults to h-8). */
export function Logo({
  className,
  variant = "main",
}: {
  className?: string;
  variant?: Variant;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={variant === "white" ? "/logo-full-white.png" : "/logo-full-main.png"}
      alt="Kodemap"
      className={cn("h-8 w-auto object-contain", className)}
      draggable={false}
    />
  );
}
