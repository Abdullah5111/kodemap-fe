"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orgApi, type MyInvitation } from "@/lib/orgs";
import { apiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Loading, ErrorState, EmptyState } from "@/components/ui/feedback";
import { IconUsers } from "@/components/ui/icons";

export default function InvitationsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["my-invitations"],
    queryFn: orgApi.myInvitations,
  });

  const invites = data ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Learn / Invitations"
        title="Invitations"
        description="Organizations that have invited you. Accept to join and appear on their leaderboard."
      />

      <div className="mt-5">
        {isLoading ? (
          <Loading label="Loading invitations…" />
        ) : error ? (
          <ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} />
        ) : invites.length === 0 ? (
          <EmptyState
            title="No pending invitations"
            description="When someone invites you to an organization, it'll show up here."
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {invites.map((inv) => (
              <InviteRow key={inv.id} inv={inv} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InviteRow({ inv }: { inv: MyInvitation }) {
  const qc = useQueryClient();
  const router = useRouter();

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["my-invitations"] });
    qc.invalidateQueries({ queryKey: ["my-invitations-count"] });
    qc.invalidateQueries({ queryKey: ["organizations"] });
  }

  const respond = useMutation({
    mutationFn: (action: "accept" | "reject") => orgApi.respond(inv.id, action),
    onSuccess: (_data, action) => {
      invalidate();
      if (action === "accept") router.push(`/organizations/${inv.organization_slug}`);
    },
  });

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-ember-soft text-ember">
        <IconUsers className="size-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <b className="block truncate text-[15px]">{inv.organization_name}</b>
        <span className="font-mono text-[11.5px] text-ink-mute">
          {inv.invited_by ? `invited by ${inv.invited_by}` : "invitation"}
        </span>
      </div>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={respond.isPending}
          onClick={() => respond.mutate("reject")}
        >
          Decline
        </Button>
        <Button size="sm" disabled={respond.isPending} onClick={() => respond.mutate("accept")}>
          Accept
        </Button>
      </div>
    </div>
  );
}
