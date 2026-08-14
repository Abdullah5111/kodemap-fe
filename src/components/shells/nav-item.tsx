"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function NavItem({
  href,
  label,
  icon,
  exact,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
  badge?: number;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-[10px] border border-transparent px-3 py-2.5 text-sm font-medium transition-[box-shadow,background-color,color] duration-150",
        active
          ? "bg-brand-grad-btn text-white brand-glow-sm"
          : "text-ink-dim hover:bg-ground hover:text-ink",
      )}
    >
      <span className="[&>svg]:size-[17px]">{icon}</span>
      {label}
      {badge ? (
        <span className="ml-auto inline-flex min-w-[18px] items-center justify-center rounded-full bg-ember px-1.5 py-0.5 font-mono text-[10.5px] font-bold text-on-ember">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </Link>
  );
}
