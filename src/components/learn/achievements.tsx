"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { statsApi, type Badge, type BadgeTier } from "@/lib/stats";
import { useAuth } from "@/components/auth-provider";
import {
  IconSpark,
  IconRocket,
  IconMedal,
  IconGlobe,
  IconFlame,
  IconTrophy,
} from "@/components/ui/icons";
import { cn } from "@/lib/cn";

const BADGE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  spark: IconSpark,
  rocket: IconRocket,
  medal: IconMedal,
  globe: IconGlobe,
  flame: IconFlame,
  trophy: IconTrophy,
};

// Tier → the earned-badge color. Unearned badges render muted regardless.
const TIER: Record<BadgeTier, string> = {
  gold: "text-warn bg-warn-soft border-warn/40",
  silver: "text-tan bg-tan-soft border-tan/40",
  bronze: "text-ember bg-ember-soft border-ember-line",
};

export function BadgeMedal({ badge, size = 44 }: { badge: Badge; size?: number }) {
  const Icon = BADGE_ICON[badge.icon] ?? IconSpark;
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-2xl border",
        badge.earned ? TIER[badge.tier] : "border-line bg-elevated text-ink-mute opacity-55",
      )}
      style={{ width: size, height: size }}
    >
      <Icon className="size-1/2" />
    </span>
  );
}

/** The achievements grid for the profile page. */
export function BadgeShelf() {
  const { data } = useQuery({ queryKey: ["badges"], queryFn: statsApi.myBadges });
  if (!data) return null;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h3 className="text-[15px] font-bold">Achievements</h3>
        <span className="font-mono text-[12px] text-ink-mute tabular-nums">
          {data.earned_count}/{data.total} unlocked
        </span>
      </div>
      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        {data.badges.map((b) => (
          <div
            key={b.code}
            className={cn(
              "flex items-center gap-3 rounded-2xl border p-3 transition-colors",
              b.earned ? "border-line bg-surface" : "border-line bg-surface/50",
            )}
          >
            <BadgeMedal badge={b} />
            <div className="min-w-0">
              <div className={cn("text-[13.5px] font-semibold", !b.earned && "text-ink-dim")}>
                {b.name}
              </div>
              <p className="text-[12px] leading-snug text-ink-mute">{b.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Watches the badges query and toasts anything newly unlocked. Mount once inside
 * the learner shell. It never toasts the initial set — only badges that appear
 * after the first successful load, so a solve anywhere in the app pops a toast
 * once its onSuccess invalidates ["badges"].
 */
export function AchievementWatcher() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["badges"],
    queryFn: statsApi.myBadges,
    enabled: !!user,
    refetchOnWindowFocus: true,
  });
  const seen = useRef<Set<string> | null>(null);
  const [toasts, setToasts] = useState<Badge[]>([]);

  useEffect(() => {
    if (!data) return;
    const earned = data.badges.filter((b) => b.earned);
    const codes = new Set(earned.map((b) => b.code));
    if (seen.current === null) {
      seen.current = codes; // establish baseline; don't toast on first load
      return;
    }
    const fresh = earned.filter((b) => !seen.current!.has(b.code));
    if (fresh.length) {
      seen.current = codes;
      setToasts((t) => [...t, ...fresh]);
      fresh.forEach((b) => {
        setTimeout(() => setToasts((t) => t.filter((x) => x.code !== b.code)), 6500);
      });
    }
  }, [data]);

  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((b) => (
        <div
          key={b.code}
          className="brand-glow flex items-center gap-3 rounded-2xl border border-ember-line bg-surface p-3 pr-4 shadow-xl [animation:xp-in_.35s_ease-out]"
          role="status"
        >
          <BadgeMedal badge={b} size={40} />
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-ember">
              Achievement unlocked
            </div>
            <div className="text-[14px] font-bold">{b.name}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
