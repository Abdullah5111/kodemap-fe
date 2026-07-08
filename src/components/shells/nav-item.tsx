"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function NavItem({
  href,
  label,
  icon,
  exact,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-[10px] border border-transparent px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "border-ember-line bg-ember-soft text-ember"
          : "text-ink-dim hover:bg-ground hover:text-ink",
      )}
    >
      <span className="[&>svg]:size-[17px]">{icon}</span>
      {label}
    </Link>
  );
}
