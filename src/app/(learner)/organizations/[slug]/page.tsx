"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orgApi, type OrgDetail, type UserSearchResult } from "@/lib/orgs";
import { type LeaderboardEntry } from "@/lib/stats";
import { apiErrorMessage } from "@/lib/api";
import { BackLink } from "@/components/ui/back-link";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loading, ErrorState, EmptyState } from "@/components/ui/feedback";
import { IconSearch, IconFlame } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

type Tab = "members" | "leaderboard";

export default function OrganizationDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("members");
  const [showInvite, setShowInvite] = useState(false);

  const { data: org, isLoading, error, refetch } = useQuery({
    queryKey: ["organization", slug],
    queryFn: () => orgApi.detail(slug),
    enabled: !!slug,
  });

  const leave = useMutation({
    mutationFn: () => orgApi.leave(slug),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["organizations"] });
      router.replace("/organizations");
    },
  });
  const del = useMutation({
    mutationFn: () => orgApi.remove(slug),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["organizations"] });
      router.replace("/organizations");
    },
  });

  if (isLoading) return <Loading label="Loading organization…" />;
  if (error)
    return (
      <div>
        <BackLink href="/organizations">Organizations</BackLink>
        <div className="mt-4">
          <ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} />
        </div>
      </div>
    );
  if (!org) return null;

  return (
    <div>
      <BackLink href="/organizations">Organizations</BackLink>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[clamp(20px,3vw,26px)] font-bold tracking-tight">{org.name}</h1>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-mono text-[10.5px] font-semibold",
                org.is_owner ? "bg-ember-soft text-ember" : "bg-elevated text-ink-dim",
              )}
            >
              {org.my_role}
            </span>
          </div>
          <p className="mt-1 font-mono text-[12px] text-ink-mute">
            {org.member_count} member{org.member_count === 1 ? "" : "s"} · owned by{" "}
            {org.owner_username}
          </p>
          {org.description ? (
            <p className="mt-2 max-w-[65ch] text-sm text-ink-dim">{org.description}</p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowInvite(true)}>
            Invite
          </Button>
          {org.is_owner ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={del.isPending}
              onClick={() => {
                if (confirm("Delete this organization for everyone? This can't be undone."))
                  del.mutate();
              }}
            >
              Delete
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              disabled={leave.isPending}
              onClick={() => {
                if (confirm("Leave this organization?")) leave.mutate();
              }}
            >
              Leave
            </Button>
          )}
        </div>
      </div>

      {/* tabs */}
      <div className="mt-5 flex gap-1.5">
        {(["members", "leaderboard"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-[9px] border px-3.5 py-2 text-[13px] font-medium capitalize transition-colors",
              tab === t
                ? "border-ember-line bg-ember-soft text-ember"
                : "border-line bg-surface text-ink-dim hover:text-ink",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "members" ? (
          <MembersTab org={org} slug={slug} />
        ) : (
          <LeaderboardTab slug={slug} />
        )}
      </div>

      {showInvite ? <InviteModal slug={slug} onClose={() => setShowInvite(false)} /> : null}
    </div>
  );
}

function MembersTab({ org, slug }: { org: OrgDetail; slug: string }) {
  const qc = useQueryClient();
  const remove = useMutation({
    mutationFn: (userId: number) => orgApi.removeMember(slug, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["organization", slug] }),
  });

  const { data: pending } = useQuery({
    queryKey: ["org-invites", slug],
    queryFn: () => orgApi.invitesForOrg(slug),
    enabled: !!slug,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        {org.members.map((m) => (
          <div
            key={m.user_id}
            className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0"
          >
            <Avatar name={m.full_name || m.username} className="size-8" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-medium">
                {m.username}
                {m.full_name ? <span className="text-ink-mute"> · {m.full_name}</span> : null}
              </div>
            </div>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold",
                m.role === "owner" ? "bg-ember-soft text-ember" : "bg-elevated text-ink-dim",
              )}
            >
              {m.role}
            </span>
            {org.is_owner && m.role !== "owner" ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Remove ${m.username} from the organization?`))
                    remove.mutate(m.user_id);
                }}
                className="font-mono text-[12px] text-ink-mute transition-colors hover:text-bad"
              >
                remove
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {pending && pending.length > 0 ? (
        <div>
          <h3 className="mb-2 font-mono text-[11px] uppercase tracking-wider text-ink-mute">
            Pending invitations ({pending.length})
          </h3>
          <div className="overflow-hidden rounded-2xl border border-dashed border-line-2 bg-surface">
            {pending.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 border-b border-line px-4 py-2.5 text-[13px] last:border-b-0"
              >
                <span className="flex-1 truncate">
                  {p.username}
                  {p.full_name ? <span className="text-ink-mute"> · {p.full_name}</span> : null}
                </span>
                <span className="font-mono text-[11px] text-warn">pending</span>
                {p.invited_by ? (
                  <span className="font-mono text-[11px] text-ink-mute">by {p.invited_by}</span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LeaderboardTab({ slug }: { slug: string }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["org-leaderboard", slug],
    queryFn: () => orgApi.leaderboard(slug),
    enabled: !!slug,
  });

  if (isLoading) return <Loading label="Loading leaderboard…" />;
  if (error) return <ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} />;
  const rows = data?.results ?? [];
  if (rows.length === 0)
    return <EmptyState title="No ranked members yet" description="Solve questions to climb the board." />;

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-wider text-ink-mute">
            <th className="px-4 py-2.5 font-semibold">#</th>
            <th className="px-4 py-2.5 font-semibold">Member</th>
            <th className="px-4 py-2.5 text-right font-semibold">Score</th>
            <th className="px-4 py-2.5 text-right font-semibold">Solved</th>
            <th className="px-4 py-2.5 text-right font-semibold">Streak</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e: LeaderboardEntry) => (
            <tr
              key={e.user_id}
              className={cn("border-b border-line last:border-b-0", e.is_me && "bg-ember-soft")}
            >
              <td className={cn("px-4 py-3", e.is_me && "shadow-[inset_3px_0_0_var(--ember)]")}>
                <span
                  className={cn(
                    "font-mono font-bold tabular-nums",
                    e.rank <= 3 ? "text-ember" : "text-ink-mute",
                  )}
                >
                  {e.rank}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={e.full_name || e.username} className="size-8" />
                  <b className="text-[14px] font-semibold">
                    {e.username}
                    {e.is_me ? <span className="text-ink-mute"> · you</span> : null}
                  </b>
                </div>
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums">
                {e.score.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums">{e.solved}</td>
              <td className="px-4 py-3 text-right">
                <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-ember">
                  <IconFlame className="size-[14px]" />
                  {e.streak}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InviteModal({ slug, onClose }: { slug: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const { data: results, isFetching } = useQuery({
    queryKey: ["org-user-search", slug, q.trim()],
    queryFn: () => orgApi.searchUsers(slug, q.trim()),
    enabled: q.trim().length >= 2,
  });

  const invite = useMutation({
    mutationFn: (u: UserSearchResult) => orgApi.invite(slug, u.id),
    onSuccess: (_data, u) => {
      setMsg(`Invited ${u.username}.`);
      setErr(null);
      qc.invalidateQueries({ queryKey: ["org-user-search", slug] });
      qc.invalidateQueries({ queryKey: ["org-invites", slug] });
    },
    onError: (e) => {
      setMsg(null);
      setErr(apiErrorMessage(e, "Couldn't send the invite."));
    },
  });

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-[480px] rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow)]">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-bold">Invite members</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-ink-mute hover:bg-ground hover:text-ink"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-[9px] border border-line bg-ground px-3 py-2 font-mono text-[13px] text-ink-mute transition-colors focus-within:border-ember-line">
          <IconSearch className="size-[15px]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by username, or exact email…"
            className="w-full bg-transparent text-ink outline-none placeholder:text-ink-mute"
            autoFocus
          />
        </div>

        {msg ? <p className="mt-2 text-[12.5px] text-ok">{msg}</p> : null}
        {err ? <p className="mt-2 text-[12.5px] text-bad">{err}</p> : null}

        <div className="mt-3 min-h-[80px]">
          {q.trim().length < 2 ? (
            <p className="py-6 text-center text-[13px] text-ink-mute">
              Type at least 2 characters to search.
            </p>
          ) : isFetching ? (
            <p className="py-6 text-center font-mono text-[12px] text-ink-mute">searching…</p>
          ) : (results ?? []).length === 0 ? (
            <p className="py-6 text-center text-[13px] text-ink-mute">
              No matching users (already members and pending invites are hidden).
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {results!.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 rounded-lg border border-line px-3 py-2"
                >
                  <Avatar name={u.full_name || u.username} className="size-8" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-medium">{u.username}</div>
                    {u.full_name ? (
                      <div className="truncate font-mono text-[11px] text-ink-mute">
                        {u.full_name}
                      </div>
                    ) : null}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={invite.isPending}
                    onClick={() => invite.mutate(u)}
                  >
                    Invite
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
