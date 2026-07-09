"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi } from "@/lib/auth-api";
import { apiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { OtpInput } from "@/components/ui/otp-input";

const emailSchema = z.object({ email: z.string().email("Enter a valid email.") });
type EmailValues = z.infer<typeof emailSchema>;

const resetSchema = z.object({ new_password: z.string().min(8, "At least 8 characters.") });
type ResetValues = z.infer<typeof resetSchema>;

function ForgotInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: params.get("email") ?? "" },
  });
  const resetForm = useForm<ResetValues>({ resolver: zodResolver(resetSchema) });

  async function requestCode(values: EmailValues) {
    setError(null);
    try {
      await authApi.requestReset(values.email);
      setEmail(values.email);
      setStep("confirm");
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't send a reset code."));
    }
  }

  async function confirmReset(values: ResetValues) {
    setError(null);
    if (code.replace(/\D/g, "").length < 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    try {
      await authApi.confirmReset(email, code, values.new_password);
      router.replace("/login?reset=1");
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't reset your password."));
    }
  }

  return (
    <div className="mx-auto w-full max-w-[420px] rounded-2xl border border-line bg-surface p-7 shadow-[var(--shadow)]">
      <h1 className="text-[22px] font-bold tracking-tight">Reset your password</h1>

      {step === "request" ? (
        <>
          <p className="mt-1.5 text-sm text-ink-dim">
            Enter your email and we&apos;ll send a code to reset your password.
          </p>
          <form onSubmit={emailForm.handleSubmit(requestCode)} className="mt-6 flex flex-col gap-4" noValidate>
            <Field label="Email" htmlFor="email" error={emailForm.formState.errors.email?.message}>
              <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...emailForm.register("email")} />
            </Field>
            {error ? <p className="text-[13px] text-bad">{error}</p> : null}
            <Button type="submit" disabled={emailForm.formState.isSubmitting} className="w-full">
              {emailForm.formState.isSubmitting ? "Sending…" : "Send reset code"}
            </Button>
          </form>
        </>
      ) : (
        <>
          <p className="mt-1.5 text-sm text-ink-dim">
            Enter the code sent to <span className="font-medium text-ink">{email}</span> and choose a
            new password.
          </p>
          <div className="mt-6">
            <OtpInput value={code} onChange={setCode} invalid={!!error} />
          </div>
          <form onSubmit={resetForm.handleSubmit(confirmReset)} className="mt-4 flex flex-col gap-4" noValidate>
            <Field label="New password" htmlFor="new_password" error={resetForm.formState.errors.new_password?.message} hint="At least 8 characters.">
              <Input id="new_password" type="password" autoComplete="new-password" placeholder="••••••••" {...resetForm.register("new_password")} />
            </Field>
            {error ? <p className="text-[13px] text-bad">{error}</p> : null}
            <Button type="submit" disabled={resetForm.formState.isSubmitting} className="w-full">
              {resetForm.formState.isSubmitting ? "Updating…" : "Update password"}
            </Button>
          </form>
        </>
      )}

      <p className="mt-6 text-center text-[13px] text-ink-dim">
        <Link href="/login" className="font-semibold text-ember hover:text-ember-hover">
          ← Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function ForgotPage() {
  return (
    <Suspense fallback={null}>
      <ForgotInner />
    </Suspense>
  );
}
