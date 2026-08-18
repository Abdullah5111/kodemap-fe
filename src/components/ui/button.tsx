import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "quiet" | "danger";
type Size = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-[filter,box-shadow,background-color,border-color,color] duration-150 disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none focus-visible:outline-2 focus-visible:outline-ember";

const variants: Record<Variant, string> = {
  primary: "bg-brand-grad-btn text-white brand-glow-sm hover:brightness-110",
  ghost: "bg-elevated text-ink border border-line-2 hover:bg-raise hover:border-tan hover:text-tan",
  quiet: "bg-transparent text-ink-dim border border-line hover:bg-elevated hover:text-ink hover:border-line-2",
  danger: "bg-bad text-white shadow-[0_6px_18px_-8px_rgba(233,86,76,0.5)] hover:brightness-110",
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
