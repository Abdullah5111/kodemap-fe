"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { authApi } from "@/lib/auth-api";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { homePathForRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

const schema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});
type FormValues = z.infer<typeof schema>;

function isUnverified(err: unknown): boolean {
  if (!axios.isAxiosError(err)) return false;
  const data = err.response?.data as { code?: unknown; detail?: unknown } | undefined;
  const code = data?.code;
  const flat = Array.isArray(code) ? code.join() : String(code ?? "");
  const detail = Array.isArray(data?.detail) ? data.detail.join() : String(data?.detail ?? "");
  return flat.includes("email_not_verified") || /not verified/i.test(detail);
}

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      await authApi.login(values.email, values.password);
      const me = await refresh();
      router.replace(me ? homePathForRole(me.role) : "/roadmap");
    } catch (err) {
      if (isUnverified(err)) {
        router.push(`/verify?email=${encodeURIComponent(values.email)}`);
        return;
      }
      setFormError(apiErrorMessage(err, "Couldn't sign in. Check your details and try again."));
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-7 shadow-[var(--shadow)]">
      <h1 className="text-[22px] font-bold tracking-tight">Welcome back</h1>
      <p className="mt-1.5 text-sm text-ink-dim">Sign in to pick up your roadmap.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register("email")}
          />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...register("password")}
          />
        </Field>

        <div className="-mt-1 text-right">
          <Link
            href={`/forgot?email=${encodeURIComponent(getValues("email") ?? "")}`}
            className="font-mono text-[12px] text-ink-mute hover:text-ember"
          >
            Forgot password?
          </Link>
        </div>

        {formError ? (
          <p className="rounded-[9px] border border-bad/40 bg-bad-soft px-3 py-2 text-[13px] text-bad">
            {formError}
          </p>
        ) : null}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-ink-dim">
        New to Kodemap?{" "}
        <Link href="/register" className="font-semibold text-ember hover:text-ember-hover">
          Create an account
        </Link>
      </p>
    </div>
  );
}
