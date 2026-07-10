"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { contentApi, type TrackCategory } from "@/lib/content";
import { apiErrorMessage } from "@/lib/api";
import { Loading, ErrorState, EmptyState } from "@/components/ui/feedback";
import { IconRoadmap } from "@/components/ui/icons";

const CATEGORY_LABEL: Record<TrackCategory, string> = {
  beginner: "Beginner",
  dsa: "DSA Foundation",
  competitive: "Competitive",
};

export default function RoadmapPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["roadmap"],
    queryFn: contentApi.roadmap,
  });

  return (
    <div>
      <p className="font-mono text-[12px] text-ink-mute">learn / roadmap</p>
      <h1 className="mt-1 text-[clamp(21px,3vw,27px)] font-bold tracking-tight">Choose your track</h1>
      <p className="mt-2 max-w-[60ch] text-sm text-ink-dim">
        Each track is a guided path — modules break into lessons, and every lesson has must-do
        questions. Pick where you are and follow the roadmap.
      </p>

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
            {data.map((track) => (
              <Link
                key={track.id}
                href={`/roadmap/${track.slug}`}
                className="group flex flex-col rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-line-2"
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-9 place-items-center rounded-[10px] bg-elevated text-tan">
                    <IconRoadmap className="size-[18px]" />
                  </span>
                  <span className="rounded-md border border-line px-2 py-0.5 font-mono text-[11px] text-ink-mute">
                    {CATEGORY_LABEL[track.category]}
                  </span>
                </div>
                <h2 className="mt-3 text-[17px] font-bold group-hover:text-ember">{track.title}</h2>
                <p className="mt-1 line-clamp-2 text-[13px] text-ink-dim">{track.description}</p>
                <div className="mt-4 flex items-center gap-4 font-mono text-[12px] text-ink-mute">
                  <span>
                    <span className="text-ink">{track.module_count}</span> modules
                  </span>
                  <span>
                    <span className="text-ink">{track.question_count}</span> questions
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
