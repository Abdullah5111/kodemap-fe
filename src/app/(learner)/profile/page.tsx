"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi } from "@/lib/auth-api";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Avatar } from "@/components/ui/avatar";
import { Loading } from "@/components/ui/feedback";
import { IconFlame, IconCheck } from "@/components/ui/icons";

const EDUCATION_LEVELS = [
  { value: "matric", label: "Matric" },
  { value: "intermediate", label: "Intermediate" },
  { value: "undergraduate", label: "Undergraduate" },
  { value: "graduate", label: "Graduate" },
  { value: "other", label: "Other" },
] as const;

const currentYear = 2026;

const schema = z.object({
  full_name: z.string().min(1, "Enter your full name.").max(150),
  current_year: z.string().max(40).optional(),
  education_level: z.string().optional(),
  institution: z.string().max(150).optional(),
  field_of_study: z.string().max(120).optional(),
  graduation_year: z
    .string()
    .optional()
    .refine(
      (v) => !v || (/^\d{4}$/.test(v) && Number(v) >= 1980 && Number(v) <= currentYear + 10),
      "Enter a valid year.",
    ),
  github_url: z.union([z.literal(""), z.string().url("Enter a valid URL.")]).optional(),
  bio: z.string().max(500, "Keep it under 500 characters.").optional(),
});
type FormValues = z.infer<typeof schema>;

const MAX_AVATAR_MB = 3;

export default function ProfilePage() {
  const { user, loading, refresh } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: user
      ? {
          full_name: user.full_name,
          current_year: user.current_year,
          education_level: user.education_level || "",
          institution: user.institution,
          field_of_study: user.field_of_study,
          graduation_year: user.graduation_year ? String(user.graduation_year) : "",
          github_url: user.github_url,
          bio: user.bio,
        }
      : undefined,
  });

  if (loading) return <Loading label="Loading your profile…" />;
  if (!user) return null;

  async function onSubmit(values: FormValues) {
    setFormError(null);
    setSaved(false);
    try {
      await authApi.updateProfile({
        full_name: values.full_name,
        current_year: values.current_year ?? "",
        education_level: values.education_level ?? "",
        institution: values.institution ?? "",
        field_of_study: values.field_of_study ?? "",
        graduation_year: values.graduation_year ? Number(values.graduation_year) : null,
        github_url: values.github_url ?? "",
        bio: values.bio ?? "",
      });
      await refresh();
      setSaved(true);
    } catch (err) {
      setFormError(apiErrorMessage(err, "Couldn't save your changes."));
    }
  }

  async function onAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setAvatarError(null);
    if (!file.type.startsWith("image/")) {
      setAvatarError("Choose an image file.");
      return;
    }
    if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
      setAvatarError(`Image must be under ${MAX_AVATAR_MB}MB.`);
      return;
    }
    setUploading(true);
    try {
      await authApi.uploadAvatar(file);
      await refresh();
    } catch (err) {
      setAvatarError(apiErrorMessage(err, "Couldn't upload that image."));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <p className="font-mono text-[12px] text-ink-mute">learn / profile</p>
      <h1 className="mt-1 text-[clamp(21px,3vw,27px)] font-bold tracking-tight">Your profile</h1>

      {/* identity card */}
      <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 sm:flex-row sm:items-center">
        <div className="relative">
          {user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar}
              alt={user.username}
              className="size-[72px] rounded-full object-cover"
            />
          ) : (
            <Avatar name={user.full_name || user.username} className="size-[72px] text-[22px]" />
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full border border-line bg-elevated text-ink-dim transition-colors hover:text-ember disabled:opacity-60"
            aria-label="Change avatar"
            title="Change avatar"
          >
            {uploading ? (
              <span className="size-3 animate-spin rounded-full border-2 border-ink-mute border-t-transparent" />
            ) : (
              <svg viewBox="0 0 24 24" className="size-[15px]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L8 6H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3l-1.5-2z" />
                <circle cx="12" cy="13" r="3.2" />
              </svg>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatarPick} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[18px] font-bold">{user.full_name || user.username}</h2>
            {user.is_email_verified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-ok-soft px-2 py-0.5 font-mono text-[10.5px] font-semibold text-ok">
                <IconCheck className="size-[11px]" /> Verified
              </span>
            ) : null}
            {user.batch_name ? (
              <span className="rounded-full bg-tan-soft px-2 py-0.5 font-mono text-[10.5px] font-semibold text-tan">
                {user.batch_name}
              </span>
            ) : null}
          </div>
          <div className="font-mono text-[12.5px] text-ink-mute">@{user.username} · {user.email}</div>
          <div className="mt-1.5 flex items-center gap-3 font-mono text-[12px] text-ink-mute">
            <span className="inline-flex items-center gap-1 text-ember">
              <IconFlame className="size-[13px]" /> {user.streak_count} day streak
            </span>
            <span>· joined {new Date(user.date_joined).toLocaleDateString()}</span>
          </div>
          {avatarError ? <p className="mt-1.5 text-[12px] text-bad">{avatarError}</p> : null}
          <p className="mt-1 font-mono text-[11px] text-ink-mute">
            PNG or JPG, up to {MAX_AVATAR_MB}MB. Email and username can&apos;t be changed.
          </p>
        </div>
      </div>

      {/* edit form */}
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5" noValidate>
        <Field label="Full name" htmlFor="full_name" error={errors.full_name?.message}>
          <Input id="full_name" autoComplete="name" {...register("full_name")} />
        </Field>

        <div className="my-1 flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-ink-mute">
          <span className="h-px flex-1 bg-line" />
          Education
          <span className="h-px flex-1 bg-line" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Level" htmlFor="education_level">
            <Select id="education_level" {...register("education_level")}>
              <option value="">Select…</option>
              {EDUCATION_LEVELS.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Current year" htmlFor="current_year" hint="e.g. 2nd year, 6th semester">
            <Input id="current_year" placeholder="2nd year" {...register("current_year")} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Institution" htmlFor="institution">
            <Input id="institution" placeholder="State University" {...register("institution")} />
          </Field>
          <Field label="Field of study" htmlFor="field_of_study">
            <Input id="field_of_study" placeholder="Computer Science" {...register("field_of_study")} />
          </Field>
        </div>

        <Field label="Graduation year" htmlFor="graduation_year" error={errors.graduation_year?.message}>
          <Input id="graduation_year" type="number" inputMode="numeric" placeholder="2027" {...register("graduation_year")} />
        </Field>

        <div className="my-1 flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-ink-mute">
          <span className="h-px flex-1 bg-line" />
          Presentation
          <span className="h-px flex-1 bg-line" />
        </div>

        <Field label="GitHub" htmlFor="github_url" error={errors.github_url?.message}>
          <Input id="github_url" placeholder="https://github.com/you" {...register("github_url")} />
        </Field>
        <Field label="Bio" htmlFor="bio" error={errors.bio?.message} hint="A short line about you, shown on your public profile.">
          <Textarea id="bio" placeholder="Undergrad grinding DSA…" {...register("bio")} />
        </Field>

        {formError ? (
          <p className="rounded-[9px] border border-bad/40 bg-bad-soft px-3 py-2 text-[13px] text-bad">
            {formError}
          </p>
        ) : null}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
          {saved && !isDirty ? (
            <span className="inline-flex items-center gap-1.5 font-mono text-[12.5px] text-ok">
              <IconCheck className="size-4" /> Saved
            </span>
          ) : null}
        </div>
      </form>
    </div>
  );
}
