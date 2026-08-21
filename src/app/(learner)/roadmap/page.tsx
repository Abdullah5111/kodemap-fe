"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { contentApi, type TrackCategory } from "@/lib/content";
import { apiErrorMessage } from "@/lib/api";
import { Loading, ErrorState, EmptyState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import {
  IconRoadmap,
  IconTests,
  IconTrophy,
  IconQuestions,
  IconList,
  IconDashboard,
  IconCheck,
} from "@/components/ui/icons";

const CATEGORY_LABEL: Record<TrackCategory, string> = {
  beginner: "Beginner",
  dsa: "DSA Foundation",
  competitive: "Competitive",
};

// A distinct icon + accent per card (by position) so no two adjacent cards look
// the same — and none use the flame, which reads as the streak marker.
const TILES: { icon: React.ReactNode; cls: string }[] = [
  { icon: <IconRoadmap className="size-[18px]" />, cls: "bg-ember-soft text-ember" },
  { icon: <IconTests className="size-[18px]" />, cls: "bg-tan-soft text-tan" },
  { icon: <IconTrophy className="size-[18px]" />, cls: "bg-warn-soft text-warn" },
  { icon: <IconQuestions className="size-[18px]" />, cls: "bg-ok-soft text-ok" },
  { icon: <IconDashboard className="size-[18px]" />, cls: "bg-ember-soft text-ember" },
  { icon: <IconList className="size-[18px]" />, cls: "bg-tan-soft text-tan" },
];

export default function RoadmapPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["roadmap"],
    queryFn: contentApi.roadmap,
  });

  return (
    <div>
      <PageHeader
        eyebrow="Learn / Roadmap"
        title="Choose your track"
        description="Each track is a guided path — modules break into lessons, and every lesson has must-do questions. Pick where you are and follow the roadmap."
      />

      <div className="mt-6">
        {isLoading ? (
          <Loading label="Loading tracks…" />
        ) : error ? (
          <ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} />
        ) : !data || data.length === 0 ? (
          <EmptyState
            title="No tracks yet"
            description="An admin hasn't published any tracks. Check back soon."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {data.map((track, i) => {
              const tile = TILES[i % TILES.length];
              return (
                <Link
                  key={track.id}
                  href={`/roadmap/${track.slug}`}
                  className="group flex flex-col rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-line-2 hover:bg-elevated"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`grid size-9 place-items-center rounded-[10px] ${tile.cls}`}>
                      {tile.icon}
                    </span>
                    <div className="flex items-center gap-2">
                      {track.is_complete ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-ok-soft px-2 py-0.5 font-mono text-[10.5px] font-semibold text-ok">
                          <IconCheck className="size-[12px]" />
                          Done
                        </span>
                      ) : null}
                      <span className="rounded-md border border-line px-2 py-0.5 font-mono text-[11px] text-ink-mute">
                        {CATEGORY_LABEL[track.category]}
                      </span>
                    </div>
                  </div>
                  <h2 className="mt-3 text-[17px] font-bold group-hover:text-ember">{track.title}</h2>
                  <p className="mt-1 line-clamp-2 text-[13px] text-ink-dim">{track.description}</p>

                  <div className="mt-4 flex items-center gap-6">
                    <Stat value={track.module_count} label="modules" />
                    <Stat value={track.question_count} label="questions" />
                    <Stat
                      value={`${track.solved_count}/${track.question_count}`}
                      label="solved"
                      accent
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  value,
  label,
  accent,
}: {
  value: React.ReactNode;
  label: string;
  accent?: boolean;
}) {
  return (
    <div>
      <div
        className={`font-mono text-[19px] font-bold tabular-nums leading-none ${accent ? "text-ember" : "text-ink"}`}
      >
        {value}
      </div>
      <div className="mt-1 font-mono text-[10.5px] uppercase tracking-wider text-ink-mute">
        {label}
      </div>
    </div>
  );
}
