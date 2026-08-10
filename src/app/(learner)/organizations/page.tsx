"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orgApi, type OrgSummary } from "@/lib/orgs";
import { apiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Loading, ErrorState, EmptyState } from "@/components/ui/feedback";
import { IconUsers } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

export default function OrganizationsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["organizations"],
    queryFn: orgApi.list,
  });

  const orgs = data ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[clamp(21px,3vw,27px)] font-bold tracking-tight">Organizations</h1>
          <p className="mt-2 max-w-[60ch] text-sm text-ink-dim">
            Create a group, invite people by username or email, and compete on your own
            leaderboard.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New organization
        </Button>
      </div>

      <div className="mt-5">
        {isLoading ? (
          <Loading label="Loading organizations…" />
        ) : error ? (
          <ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} />
        ) : orgs.length === 0 ? (
          <EmptyState
            title="No organizations yet"
            description="Create one to invite classmates and track a shared leaderboard."
            action={<Button size="sm" onClick={() => setShowCreate(true)}>New organization</Button>}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {orgs.map((o) => (
              <OrgCard key={o.id} org={o} />
            ))}
          </div>
        )}
      </div>

      {showCreate ? <CreateOrgModal onClose={() => setShowCreate(false)} /> : null}
    </div>
  );
}

function OrgCard({ org }: { org: OrgSummary }) {
  return (
    <Link
      href={`/organizations/${org.slug}`}
      className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-ember-line"
    >
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-ember-soft text-ember">
          <IconUsers className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <b className="block truncate text-[15px]">{org.name}</b>
          <span className="font-mono text-[11.5px] text-ink-mute">
            {org.member_count} member{org.member_count === 1 ? "" : "s"}
          </span>
        </div>
        {org.my_role ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold",
              org.my_role === "owner" ? "bg-ember-soft text-ember" : "bg-elevated text-ink-dim",
            )}
          >
            {org.my_role}
          </span>
        ) : null}
      </div>
      {org.description ? (
        <p className="line-clamp-2 text-[13px] text-ink-dim">{org.description}</p>
      ) : null}
    </Link>
  );
}

function CreateOrgModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () => orgApi.create({ name: name.trim(), description }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["organizations"] });
      onClose();
    },
    onError: (e) => setErr(apiErrorMessage(e, "Couldn't create the organization.")),
  });

  function submit() {
    setErr(null);
    if (name.trim().length < 2) return setErr("Give it a name (at least 2 characters).");
    create.mutate();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-[460px] rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow)]">
        <h2 className="text-[17px] font-bold">New organization</h2>
        <div className="mt-4 flex flex-col gap-3.5">
          <Field label="Name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CS-101 Study Group"
              autoFocus
            />
          </Field>
          <Field label="Description" hint="Optional.">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this group about?"
            />
          </Field>
          {err ? <p className="text-[13px] text-bad">{err}</p> : null}
          <div className="flex justify-end gap-2 border-t border-line pt-3.5">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" disabled={create.isPending} onClick={submit}>
              {create.isPending ? "Creating…" : "Create"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
