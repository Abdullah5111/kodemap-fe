import { cn } from "@/lib/cn";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  name,
  src,
  className,
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={cn("size-[30px] rounded-full object-cover", className)}
        draggable={false}
      />
    );
  }
  return (
    <span
      className={cn(
        "grid size-[30px] place-items-center rounded-full bg-ember font-mono text-[12px] font-bold text-on-ember",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
