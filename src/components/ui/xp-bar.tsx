"use client";

import { IconBolt } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

/**
 * Level + XP progress. `into`/`span` are the XP earned within the current level
 * and the XP a level costs, so the bar fills toward the next level.
 */
export function XpBar({
  level,
  into,
  span,
  className,
  size = "md",
}: {
  level: number;
  into: number;
  span: number;
  className?: string;
  size?: "md" | "sm";
}) {
  const pct = span > 0 ? Math.min(100, Math.round((into / span) * 100)) : 0;
  const sm = size === "sm";

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "bg-brand-grad brand-glow-sm inline-flex items-center gap-1 rounded-full font-mono font-bold text-white",
            sm ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12.5px]",
          )}
        >
          <IconBolt className={sm ? "size-[11px]" : "size-[13px]"} />
          LVL {level}
        </span>
        <span className={cn("font-mono tabular-nums text-ink-mute", sm ? "text-[10.5px]" : "text-[11.5px]")}>
          {into} / {span} XP
        </span>
      </div>
      <div className={cn("mt-1.5 overflow-hidden rounded-full bg-elevated", sm ? "h-1.5" : "h-2.5")}>
        <div
          className="bg-brand-grad h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
