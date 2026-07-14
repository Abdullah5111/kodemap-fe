"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, ROLE_META, type AdminUser } from "@/lib/admin";
import { STATUS_META } from "@/lib/solve";
import { timeAgo } from "@/lib/stats";
import type { Role } from "@/lib/types";
import { apiErrorMessage } from "@/lib/api";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Loading, ErrorState, EmptyState } from "@/components/ui/feedback";
import { IconSearch, IconFlame } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

function RolePill({ role }: { role: Role }) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 font-mono text-[10.5px] font-semibold", ROLE_META[role].cls)}>
      {ROLE_META[role].label}
    </span>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<Loading label="Loading users…" />}>
      <UsersView />
    </Suspense>
  );
}

function UsersView() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [active, setActive] = useState("");
  const [batch, setBatch] = useState("");
  const [ordering, setOrdering] = useState("-score");
  const [focusId, setFocusId] = useState<number | null>(null);

  const { data: batches } = useQuery({
    queryKey: ["admin-batches"],
    queryFn: adminApi.batches,
  });

  // deep-link from the dashboard (?focus=<id>)
  useEffect(() => {
    const f = searchParams.get("focus");
    if (f && /^\d+$/.test(f)) setFocusId(Number(f));
  }, [searchParams]);

  const params: Record<string, string> = { ordering };
  if (search.trim()) params.search = search.trim();
  if (role) params.role = role;
  if (active) params.is_active = active;
  if (batch) params.batch = batch;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-users", ordering, role, active, batch, search.trim()],
    queryFn: () => adminApi.users(params),
  });

  const rows = data?.results ?? [];

  return (
    <div>
      <p className="font-mono text-[12px] text-ink-mute">admin / people / users</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[clamp(20px,3vw,25px)] font-bold tracking-tight">Users</h1>
        {data ? (
          <span className="font-mono text-[12px] text-ink-mute">{data.count} total</span>
        ) : null}
      </div>

      {/* toolbar */}
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-[9px] border border-line bg-surface px-3 py-2 font-mono text-[13px] text-ink-mute">
          <IconSearch className="size-[15px]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, institution…"
            className="w-full bg-transparent text-ink outline-none placeholder:text-ink-mute"
          />
        </div>
        <Select value={role} onChange={(e) => setRole(e.target.value)} className="w-auto">
          <option value="">All roles</option>
          <option value="learner">Learners</option>
          <option value="supervisor">Supervisors</option>
          <option value="admin">Admins</option>
        </Select>
        <Select value={active} onChange={(e) => setActive(e.target.value)} className="w-auto">
          <option value="">Any status</option>
          <option value="true">Active</option>
          <option value="false">Disabled</option>
        </Select>
        <Select value={batch} onChange={(e) => setBatch(e.target.value)} className="w-auto">
          <option value="">Any batch</option>
          <option value="none">No batch</option>
          {(batches ?? []).map((b) => (
            <option key={b.id} value={String(b.id)}>{b.name}</option>
          ))}
        </Select>
        <Select value={ordering} onChange={(e) => setOrdering(e.target.value)} className="w-auto">
          <option value="-score">Top score</option>
          <option value="-solved">Most solved</option>
          <option value="-date_joined">Newest</option>
          <option value="username">A–Z</option>
        </Select>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <Loading label="Loading users…" />
        ) : error ? (
          <ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState title="No users found" description="Adjust the filters above." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-wider text-ink-mute">
                  <th className="px-3 py-2.5 font-semibold">User</th>
                  <th className="px-3 py-2.5 font-semibold">Role</th>
                  <th className="px-3 py-2.5 font-semibold">Batch</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Score</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Solved</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Streak</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <UserRow key={u.id} u={u} onOpen={() => setFocusId(u.id)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {focusId != null ? <UserDrawer id={focusId} onClose={() => setFocusId(null)} /> : null}
    </div>
  );
}

function UserRow({ u, onOpen }: { u: AdminUser; onOpen: () => void }) {
  return (
    <tr
      onClick={onOpen}
      className={cn(
        "cursor-pointer border-b border-line last:border-b-0 hover:bg-ground",
        !u.is_active && "opacity-55",
      )}
    >
      <td className="px-3 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={u.full_name || u.username} className="size-8" />
          <div className="min-w-0">
            <div className="truncate text-[14px] font-medium">{u.full_name || u.username}</div>
            <div className="truncate font-mono text-[11px] text-ink-mute">{u.email}</div>
          </div>
        </div>
      </td>
      <td className="px-3 py-3"><RolePill role={u.role} /></td>
      <td className="px-3 py-3 font-mono text-[11.5px] text-ink-mute">{u.batch_name ?? "—"}</td>
      <td className="px-3 py-3 text-right font-mono text-[13px] tabular-nums text-ember">{u.score}</td>
      <td className="px-3 py-3 text-right font-mono text-[13px] tabular-nums">{u.solved}</td>
      <td className="px-3 py-3 text-right">
        <span className="inline-flex items-center gap-1 font-mono text-[12px] text-ember">
          <IconFlame className="size-[13px]" />
          {u.streak_count}
        </span>
      </td>
      <td className="px-3 py-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 font-mono text-[12px]",
            u.is_active ? "text-ok" : "text-ink-mute",
          )}
        >
          <span className="size-[7px] rounded-full bg-current" />
          {u.is_active ? "Active" : "Disabled"}
        </span>
      </td>
    </tr>
  );
}

function UserDrawer({ id, onClose }: { id: number; onClose: () => void }) {
  const qc = useQueryClient();
  const [err, setErr] = useState<string | null>(null);

  const { data: u, isLoading } = useQuery({
    queryKey: ["admin-user", id],
    queryFn: () => adminApi.user(id),
  });

  const { data: batches } = useQuery({
    queryKey: ["admin-batches"],
    queryFn: adminApi.batches,
  });

  const mutation = useMutation({
    mutationFn: (payload: { role?: Role; is_active?: boolean; batch?: number | null }) =>
      adminApi.updateUser(id, payload),
    onSuccess: () => {
      setErr(null);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-user", id] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
      qc.invalidateQueries({ queryKey: ["admin-batches"] });
    },
    onError: (e) => setErr(apiErrorMessage(e, "Couldn't update this user.")),
  });

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <aside className="relative z-10 flex h-full w-full max-w-[420px] flex-col overflow-y-auto border-l border-line bg-surface p-5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink-mute">user detail</span>
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

        {isLoading || !u ? (
          <Loading label="Loading…" />
        ) : (
          <>
            <div className="mt-4 flex items-center gap-3">
              <Avatar name={u.full_name || u.username} className="size-12 text-[15px]" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-[17px] font-bold">{u.full_name || u.username}</h2>
                  <RolePill role={u.role} />
                </div>
                <div className="truncate font-mono text-[12px] text-ink-mute">@{u.username} · {u.email}</div>
              </div>
            </div>

            {/* stat strip */}
            <div className="mt-4 grid grid-cols-4 gap-2">
              {[
                { l: "Score", v: String(u.score) },
                { l: "Solved", v: String(u.solved) },
                { l: "Rank", v: u.rank ? `#${u.rank}` : "—" },
                { l: "Streak", v: String(u.streak_count) },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border border-line bg-ground p-2.5 text-center">
                  <div className="text-[17px] font-bold tabular-nums">{s.v}</div>
                  <div className="font-mono text-[9.5px] uppercase tracking-wider text-ink-mute">{s.l}</div>
                </div>
              ))}
            </div>

            {/* profile facts */}
            <dl className="mt-4 flex flex-col gap-2 rounded-xl border border-line bg-ground p-3.5 text-[13px]">
              <Fact label="Institution" value={u.institution} />
              <Fact label="Education" value={u.education_level} />
              <Fact label="Field" value={u.field_of_study} />
              <Fact label="Current year" value={u.current_year} />
              <Fact label="Joined" value={new Date(u.date_joined).toLocaleDateString()} />
              <Fact label="Email verified" value={u.is_email_verified ? "Yes" : "No"} />
              {u.github_url ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-mute">GitHub</dt>
                  <dd className="min-w-0 truncate">
                    <a href={u.github_url} target="_blank" rel="noreferrer" className="text-ember hover:underline">
                      {u.github_url.replace(/^https?:\/\//, "")}
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>

            {/* recent submissions */}
            <div className="mt-4">
              <h3 className="font-mono text-[11px] uppercase tracking-wider text-ink-mute">
                Recent submissions ({u.submissions_total})
              </h3>
              {u.recent_submissions.length === 0 ? (
                <p className="mt-2 font-mono text-[12px] text-ink-mute">No submissions yet.</p>
              ) : (
                <div className="mt-2 flex flex-col">
                  {u.recent_submissions.map((s) => {
                    const meta = STATUS_META[s.status];
                    return (
                      <Link
                        key={s.id}
                        href={`/admin/questions?q=${s.question_slug}`}
                        className="flex items-center gap-2 border-b border-line py-2 text-[12.5px] last:border-b-0"
                      >
                        <span className="flex-1 truncate">{s.question_title}</span>
                        <span
                          className={cn(
                            "font-mono text-[11px]",
                            meta.tone === "ok" ? "text-ok" : meta.tone === "warn" ? "text-warn" : "text-bad",
                          )}
                        >
                          {meta.label}
                        </span>
                        <span className="w-12 text-right font-mono text-[10.5px] text-ink-mute">
                          {timeAgo(s.created_at)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* actions */}
            <div className="mt-5 border-t border-line pt-4">
              <div className="font-mono text-[11px] uppercase tracking-wider text-ink-mute">Manage</div>
              {err ? <p className="mt-2 font-mono text-[12px] text-bad">{err}</p> : null}
              <div className="mt-2.5 flex flex-col gap-2">
                <label className="flex items-center justify-between gap-3 text-[13px]">
                  <span className="text-ink-dim">Role</span>
                  <Select
                    value={u.role}
                    disabled={mutation.isPending}
                    onChange={(e) => mutation.mutate({ role: e.target.value as Role })}
                    className="w-40"
                  >
                    <option value="learner">Learner</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Admin</option>
                  </Select>
                </label>
                <label className="flex items-center justify-between gap-3 text-[13px]">
                  <span className="text-ink-dim">Batch</span>
                  <Select
                    value={u.batch ?? ""}
                    disabled={mutation.isPending}
                    onChange={(e) =>
                      mutation.mutate({ batch: e.target.value ? Number(e.target.value) : null })
                    }
                    className="w-40"
                  >
                    <option value="">No batch</option>
                    {(batches ?? []).map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </Select>
                </label>
                <Button
                  variant={u.is_active ? "ghost" : "primary"}
                  size="sm"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate({ is_active: !u.is_active })}
                >
                  {u.is_active ? "Disable account" : "Re-enable account"}
                </Button>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-mute">{label}</dt>
      <dd className="min-w-0 truncate text-right capitalize">{value || "—"}</dd>
    </div>
  );
}
