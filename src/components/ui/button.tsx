import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "quiet";
type Size = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-ember";

const variants: Record<Variant, string> = {
  primary: "bg-ember text-on-ember hover:bg-ember-hover active:bg-ember-press",
  ghost: "bg-elevated text-ink border border-line-2 hover:border-tan hover:text-tan",
  quiet: "bg-transparent text-ink-dim border border-line hover:text-ink hover:border-line-2",
};

const sizes: Record<Size, string> = {
  md: "px-4 py-2.5 text-sm",
  sm: "px-3 py-2 text-[13px]",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
