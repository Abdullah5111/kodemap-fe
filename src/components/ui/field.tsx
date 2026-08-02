"use client";

import { forwardRef, useState } from "react";
import { cn } from "@/lib/cn";
import { IconEye, IconEyeOff } from "./icons";

const inputClass =
  "w-full rounded-[9px] border border-line bg-ground px-3 py-2.5 text-[14px] text-ink placeholder:text-ink-mute outline-none transition-colors focus:border-ember-line focus-visible:outline-none disabled:opacity-55";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(inputClass, className)} {...props} />;
  },
);

/** Password field with a show/hide toggle. Same props as Input; the `type` is
    controlled internally. */
export const PasswordInput = forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">
>(function PasswordInput({ className, ...props }, ref) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        ref={ref}
        type={show ? "text" : "password"}
        className={cn(inputClass, "pr-10", className)}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-mute transition-colors hover:text-ink"
      >
        {show ? <IconEyeOff className="size-[16px]" /> : <IconEye className="size-[16px]" />}
      </button>
    </div>
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea ref={ref} className={cn(inputClass, "min-h-[92px] resize-y", className)} {...props} />
  );
});

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
