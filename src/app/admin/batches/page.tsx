"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, type Batch, type BatchInput, type AdminUser } from "@/lib/admin";
import { apiErrorMessage } from "@/lib/api";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Loading, ErrorState, EmptyState } from "@/components/ui/feedback";
import { IconSearch, IconUsers } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

export default function AdminBatchesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Batch | "new" | null>(null);
  const [managing, setManaging] = useState<Batch | null>(null);

  const { data: batches, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-batches"],
    queryFn: adminApi.batches,
  });

  const del = useMutation({
    mutationFn: (id: number) => adminApi.deleteBatch(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-batches"] }),
  });

  return (
    <div>
      <p className="font-mono text-[12px] text-ink-mute">admin / people / batches</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[clamp(20px,3vw,25px)] font-bold tracking-tight">Batches</h1>
        <Button size="sm" onClick={() => setEditing("new")}>
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New batch
        </Button>
      </div>
      <p className="mt-2 max-w-[62ch] text-sm text-ink-dim">
        Group learners into cohorts. A batch gives learners a scoped leaderboard and gives a
        supervisor a group to watch.
      </p>

      <div className="mt-5">
        {isLoading ? (
          <Loading label="Loading batches…" />
        ) : error ? (
          <ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} />
        ) : !batches || batches.length === 0 ? (
          <EmptyState
            title="No batches yet"
            description="Create your first cohort to group learners."
            action={<Button size="sm" onClick={() => setEditing("new")}>New batch</Button>}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {batches.map((b) => (
              <div key={b.id} className="flex flex-col rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <b className="text-[15px]">{b.name}</b>
                    <div className="font-mono text-[11.5px] text-ink-mute">{b.code}</div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold",
                      b.is_active ? "bg-ok-soft text-ok" : "bg-elevated text-ink-mute",
                    )}
                  >
                    {b.is_active ? "Active" : "Archived"}
                  </span>
                </div>

                <div className="mt-2 flex flex-col gap-0.5 font-mono text-[11.5px] text-ink-mute">
                  <span>{b.institution || "—"}{b.start_year ? ` · ${b.start_year}` : ""}</span>
                  <span>supervisor: {b.supervisor_name || "unassigned"}</span>
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-ember">
                  <IconUsers className="size-4" />
                  <span className="font-mono text-[13px] font-semibold tabular-nums">
                    {b.member_count}
                  </span>
                  <span className="font-mono text-[11.5px] text-ink-mute">
                    {b.member_count === 1 ? "member" : "members"}
                  </span>
                </div>

                <div className="mt-3 flex gap-2 border-t border-line pt-3">
                  <Button size="sm" variant="ghost" onClick={() => setManaging(b)}>Members</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(b)}>Edit</Button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete "${b.name}"? Members will be unassigned.`)) del.mutate(b.id);
                    }}
                    className="ml-auto rounded-md px-2 font-mono text-[11.5px] text-ink-mute hover:text-bad"
                  >
                    delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing ? (
        <BatchDialog
          batch={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
      {managing ? <MembersDrawer batch={managing} onClose={() => setManaging(null)} /> : null}
    </div>
  );
}

// --------------------------- create / edit dialog ---------------------------
function BatchDialog({ batch, onClose }: { batch: Batch | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState<BatchInput>({
    name: batch?.name ?? "",
    institution: batch?.institution ?? "",
    start_year: batch?.start_year ?? null,
    description: batch?.description ?? "",
    supervisor: batch?.supervisor ?? null,
    is_active: batch?.is_active ?? true,
  });

  // supervisors + admins are the only valid batch supervisors
  const { data: staff } = useQuery({
    queryKey: ["admin-staff"],
    queryFn: async () => {
      const [sup, adm] = await Promise.all([
        adminApi.users({ role: "supervisor" }),
        adminApi.users({ role: "admin" }),
      ]);
      return [...sup.results, ...adm.results];
    },
  });

  const save = useMutation({
    mutationFn: (payload: BatchInput) =>
      batch ? adminApi.updateBatch(batch.id, payload) : adminApi.createBatch(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-batches"] });
      onClose();
    },
    onError: (e) => setErr(apiErrorMessage(e, "Couldn't save this batch.")),
  });

  return (
    <div className="fixed inset-0 z-40 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-[17px] font-bold">{batch ? "Edit batch" : "New batch"}</h2>

        <form
          className="mt-4 flex flex-col gap-3.5"
          onSubmit={(e) => {
            e.preventDefault();
            setErr(null);
            if (!form.name?.trim()) {
              setErr("Give the batch a name.");
              return;
            }
            save.mutate(form);
          }}
        >
          <Field label="Name">
            <Input
              value={form.name ?? ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Fall 2026 — CS"
              autoFocus
            />
          </Field>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Institution">
              <Input
                value={form.institution ?? ""}
                onChange={(e) => setForm({ ...form, institution: e.target.value })}
                placeholder="State University"
              />
            </Field>
            <Field label="Start year">
              <Input
                type="number"
                inputMode="numeric"
                value={form.start_year ?? ""}
                onChange={(e) =>
                  setForm({ ...form, start_year: e.target.value ? Number(e.target.value) : null })
                }
                placeholder="2026"
              />
            </Field>
          </div>

          <Field label="Supervisor" hint="Only supervisors and admins can be assigned.">
            <Select
              value={form.supervisor ?? ""}
              onChange={(e) =>
                setForm({ ...form, supervisor: e.target.value ? Number(e.target.value) : null })
              }
            >
              <option value="">Unassigned</option>
              {(staff ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name || s.username} ({s.role})
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Description">
            <Textarea
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Second-year cohort following the DSA track."
            />
          </Field>

          <label className="flex items-center gap-2 text-[13.5px] text-ink-dim">
            <input
              type="checkbox"
              checked={form.is_active ?? true}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="size-4 accent-[var(--ember)]"
            />
            Active
          </label>

          {err ? (
            <p className="rounded-[9px] border border-bad/40 bg-bad-soft px-3 py-2 text-[13px] text-bad">
              {err}
            </p>
          ) : null}

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={save.isPending}>
              {save.isPending ? "Saving…" : batch ? "Save changes" : "Create batch"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ----------------------------- members drawer ------------------------------
function MembersDrawer({ batch, onClose }: { batch: Batch; onClose: () => void }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: members, isLoading } = useQuery({
    queryKey: ["batch-members", batch.id],
    queryFn: () => adminApi.batchMembers(batch.id),
  });

  // candidates = learners not already in this batch
  const { data: learners } = useQuery({
    queryKey: ["admin-learners", search],
    queryFn: () => adminApi.users({ role: "learner", search: search || undefined }),
  });

  const memberIds = useMemo(() => new Set((members ?? []).map((m) => m.id)), [members]);
  const candidates = (learners?.results ?? []).filter((u) => !memberIds.has(u.id));

  const assign = useMutation({
    mutationFn: (payload: { add?: number[]; remove?: number[] }) =>
      adminApi.assignMembers(batch.id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["batch-members", batch.id] });
      qc.invalidateQueries({ queryKey: ["admin-batches"] });
      qc.invalidateQueries({ queryKey: ["admin-learners"] });
    },
  });

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <aside className="relative z-10 flex h-full w-full max-w-[440px] flex-col overflow-y-auto border-l border-line bg-surface p-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-mute">members</span>
            <h2 className="text-[17px] font-bold">{batch.name}</h2>
          </div>
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

        {/* current members */}
        <h3 className="mt-5 font-mono text-[11px] uppercase tracking-wider text-ink-mute">
          In this batch ({members?.length ?? 0})
        </h3>
        {isLoading ? (
          <Loading label="Loading…" />
        ) : (members ?? []).length === 0 ? (
          <p className="mt-2 font-mono text-[12px] text-ink-mute">No members yet — add some below.</p>
        ) : (
          <div className="mt-2 flex flex-col">
            {(members ?? []).map((m) => (
              <MemberRow
                key={m.id}
                u={m}
                actionLabel="remove"
                danger
                disabled={assign.isPending}
                onAction={() => assign.mutate({ remove: [m.id] })}
              />
            ))}
          </div>
        )}

        {/* add learners */}
        <h3 className="mt-6 font-mono text-[11px] uppercase tracking-wider text-ink-mute">
          Add learners
        </h3>
        <div className="mt-2 flex items-center gap-2 rounded-[9px] border border-line bg-ground px-3 py-2 font-mono text-[13px] text-ink-mute">
          <IconSearch className="size-[15px]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search learners…"
            className="w-full bg-transparent text-ink outline-none placeholder:text-ink-mute"
          />
        </div>

        <div className="mt-2 flex flex-col">
          {candidates.length === 0 ? (
            <p className="mt-1 font-mono text-[12px] text-ink-mute">
              No unassigned learners match.
            </p>
          ) : (
            candidates.map((u) => (
              <MemberRow
                key={u.id}
                u={u}
                actionLabel={u.batch_name ? `move from ${u.batch_name}` : "add"}
                disabled={assign.isPending}
                onAction={() => assign.mutate({ add: [u.id] })}
              />
            ))
          )}
        </div>
      </aside>
    </div>
  );
}

function MemberRow({
  u,
  actionLabel,
  onAction,
  disabled,
  danger,
}: {
  u: AdminUser;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 border-b border-line py-2 last:border-b-0">
      <Avatar name={u.full_name || u.username} className="size-7 text-[10px]" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px]">{u.full_name || u.username}</div>
        <div className="truncate font-mono text-[10.5px] text-ink-mute">
          @{u.username} · {u.score} pts
        </div>
      </div>
      <button
        type="button"
        onClick={onAction}
        disabled={disabled}
        className={cn(
          "shrink-0 rounded-md border border-line px-2 py-1 font-mono text-[11px] transition-colors disabled:opacity-50",
          danger ? "text-ink-mute hover:border-bad hover:text-bad" : "text-ink-dim hover:border-ember hover:text-ember",
        )}
      >
        {actionLabel}
      </button>
    </div>
  );
}
