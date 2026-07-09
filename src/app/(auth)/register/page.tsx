"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi, type RegisterPayload } from "@/lib/auth-api";
import { apiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Select } from "@/components/ui/select";

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
  username: z
    .string()
    .min(3, "At least 3 characters.")
    .max(30, "At most 30 characters.")
    .regex(/^[a-zA-Z0-9_.]+$/, "Letters, numbers, dot or underscore only."),
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "At least 8 characters."),
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
});
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    // strip empty optionals so we don't send blank strings for typed fields
    const payload: RegisterPayload = {
      full_name: values.full_name,
      username: values.username,
      email: values.email,
      password: values.password,
      education_level: values.education_level || undefined,
      institution: values.institution || undefined,
      field_of_study: values.field_of_study || undefined,
      graduation_year: values.graduation_year ? Number(values.graduation_year) : undefined,
      github_url: values.github_url || undefined,
    };
    try {
      await authApi.register(payload);
      router.push(`/verify?email=${encodeURIComponent(values.email)}`);
    } catch (err) {
      setFormError(apiErrorMessage(err, "Couldn't create your account. Please try again."));
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-7 shadow-[var(--shadow)]">
      <h1 className="text-[22px] font-bold tracking-tight">Create your account</h1>
      <p className="mt-1.5 text-sm text-ink-dim">
        Start your roadmap. We&apos;ll email a code to verify your address.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
        <Field label="Full name" htmlFor="full_name" error={errors.full_name?.message}>
          <Input id="full_name" autoComplete="name" placeholder="Alice Learner" {...register("full_name")} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Username" htmlFor="username" error={errors.username?.message} hint="Your public handle on the leaderboard.">
            <Input id="username" autoComplete="username" placeholder="alice" {...register("username")} />
          </Field>
          <Field label="Email" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
          </Field>
        </div>

        <Field label="Password" htmlFor="password" error={errors.password?.message} hint="At least 8 characters.">
          <Input id="password" type="password" autoComplete="new-password" placeholder="••••••••" {...register("password")} />
        </Field>

        <div className="my-1 flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-ink-mute">
          <span className="h-px flex-1 bg-line" />
          Education
          <span className="h-px flex-1 bg-line" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Level" htmlFor="education_level">
            <Select id="education_level" defaultValue="" {...register("education_level")}>
              <option value="">Select…</option>
              {EDUCATION_LEVELS.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Graduation year" htmlFor="graduation_year" error={errors.graduation_year?.message}>
            <Input id="graduation_year" type="number" inputMode="numeric" placeholder="2027" {...register("graduation_year")} />
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

        <Field label="GitHub" htmlFor="github_url" error={errors.github_url?.message} hint="Optional — add it now or later in your profile.">
          <Input id="github_url" placeholder="https://github.com/alice" {...register("github_url")} />
        </Field>

        {formError ? (
          <p className="rounded-[9px] border border-bad/40 bg-bad-soft px-3 py-2 text-[13px] text-bad">
            {formError}
          </p>
        ) : null}

        <Button type="submit" disabled={isSubmitting} className="mt-1 w-full">
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-ink-dim">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-ember hover:text-ember-hover">
          Sign in
        </Link>
      </p>
    </div>
  );
}
