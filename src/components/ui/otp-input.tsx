"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";

const LEN = 6;

export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(LEN).slice(0, LEN).split("");

  function setAt(i: number, char: string) {
    const next = value.split("");
    next[i] = char;
    const joined = next.join("").replace(/\s/g, "").slice(0, LEN);
    onChange(joined);
    if (joined.length === LEN && !joined.includes(" ")) onComplete?.(joined);
  }

  function handleChange(i: number, raw: string) {
    const d = raw.replace(/\D/g, "");
    if (!d) return;
    if (d.length > 1) {
      // pasted multiple digits
      const joined = (value.slice(0, i) + d).replace(/\D/g, "").slice(0, LEN);
      onChange(joined);
      const focus = Math.min(joined.length, LEN - 1);
      refs.current[focus]?.focus();
      if (joined.length === LEN) onComplete?.(joined);
      return;
    }
    setAt(i, d);
    if (i < LEN - 1) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[i].trim()) {
        setAt(i, " ");
      } else if (i > 0) {
        refs.current[i - 1]?.focus();
        setAt(i - 1, " ");
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < LEN - 1) {
      refs.current[i + 1]?.focus();
    }
  }

  return (
    <div className="flex justify-between gap-2">
      {Array.from({ length: LEN }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          value={digits[i].trim()}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          className={cn(
            "h-13 w-full min-w-0 rounded-[10px] border bg-ground py-3 text-center font-mono text-xl text-ink outline-none transition-colors focus:border-ember focus:ring-2 focus:ring-ember-soft disabled:opacity-55",
            invalid ? "border-bad" : "border-line",
          )}
        />
      ))}
    </div>
  );
}
