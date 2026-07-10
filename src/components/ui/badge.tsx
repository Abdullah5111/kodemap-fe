import { cn } from "@/lib/cn";
import { DIFFICULTY_META, type Difficulty } from "@/lib/content";

export function DifficultyBadge({
  difficulty,
  showScore = true,
}: {
  difficulty: Difficulty;
  showScore?: boolean;
}) {
  const meta = DIFFICULTY_META[difficulty];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-[11.5px] font-semibold",
        meta.cls,
      )}
    >
      <span className="size-[7px] rounded-full bg-current" />
      {meta.label}
      {showScore ? <span className="opacity-70">· {meta.score}</span> : null}
    </span>
  );
}

export function StatusDot({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[12px]",
        active ? "text-ok" : "text-ink-mute",
      )}
    >
      <span className="size-[7px] rounded-full bg-current" />
      {label}
    </span>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-line px-2 py-0.5 font-mono text-[11.5px] text-ink-mute">
      {children}
    </span>
  );
}
