import { cn } from "@/lib/cn";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        "grid size-[30px] place-items-center rounded-full bg-gradient-to-br from-tan to-ember font-mono text-[12px] font-bold text-[#1b0e06]",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
