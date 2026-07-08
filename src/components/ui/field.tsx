import { forwardRef } from "react";
import { cn } from "@/lib/cn";

const inputClass =
  "w-full rounded-[9px] border border-line bg-ground px-3 py-2.5 text-[14px] text-ink placeholder:text-ink-mute outline-none transition-colors focus:border-ember-line focus-visible:outline-none disabled:opacity-55";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(inputClass, className)} {...props} />;
  },
);

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="font-mono text-[12px] text-ink-dim">
        {label}
      </label>
      {children}
      {error ? (
        <span className="text-[12px] text-bad">{error}</span>
      ) : hint ? (
        <span className="text-[12px] text-ink-mute">{hint}</span>
      ) : null}
    </div>
  );
}
