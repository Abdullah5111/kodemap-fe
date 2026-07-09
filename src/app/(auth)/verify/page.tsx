"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/auth-api";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { homePathForRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/ui/otp-input";

const RESEND_COOLDOWN = 60;

function VerifyInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { refresh } = useAuth();
  const email = params.get("email") ?? "";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const verify = useCallback(
    async (value: string) => {
      if (submitting) return;
      setSubmitting(true);
      setError(null);
      try {
        await authApi.verifyEmail(email, value);
        const me = await refresh();
        router.replace(me ? homePathForRole(me.role) : "/roadmap");
      } catch (err) {
        setError(apiErrorMessage(err, "That code didn't work. Try again."));
        setCode("");
      } finally {
        setSubmitting(false);
      }
    },
    [email, refresh, router, submitting],
  );

  async function resend() {
    if (cooldown > 0) return;
    setError(null);
    setNotice(null);
    try {
      await authApi.resendOtp(email);
      setNotice("A new code is on its way.");
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't resend the code."));
    }
  }

  if (!email) {
    return (
      <div className="mx-auto w-full max-w-[420px] rounded-2xl border border-line bg-surface p-7 shadow-[var(--shadow)]">
        <h1 className="text-[22px] font-bold tracking-tight">Verify your email</h1>
        <p className="mt-1.5 text-sm text-ink-dim">
          We need to know which account to verify.{" "}
          <Link href="/register" className="font-semibold text-ember hover:text-ember-hover">
            Sign up
          </Link>{" "}
          or{" "}
          <Link href="/login" className="font-semibold text-ember hover:text-ember-hover">
            sign in
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[420px] rounded-2xl border border-line bg-surface p-7 shadow-[var(--shadow)]">
      <h1 className="text-[22px] font-bold tracking-tight">Check your email</h1>
      <p className="mt-1.5 text-sm text-ink-dim">
        We sent a 6-digit code to <span className="font-medium text-ink">{email}</span>. Enter it
        below to activate your account.
      </p>

      <div className="mt-6">
        <OtpInput
          value={code}
          onChange={setCode}
          onComplete={verify}
          disabled={submitting}
          invalid={!!error}
        />
      </div>

      {error ? <p className="mt-3 text-[13px] text-bad">{error}</p> : null}
      {notice ? <p className="mt-3 text-[13px] text-ok">{notice}</p> : null}

      <Button
        onClick={() => verify(code)}
        disabled={submitting || code.replace(/\D/g, "").length < 6}
        className="mt-5 w-full"
      >
        {submitting ? "Verifying…" : "Verify & continue"}
      </Button>

      <div className="mt-5 text-center text-[13px] text-ink-dim">
        Didn&apos;t get it?{" "}
        {cooldown > 0 ? (
          <span className="font-mono text-ink-mute">Resend in {cooldown}s</span>
        ) : (
          <button type="button" onClick={resend} className="font-semibold text-ember hover:text-ember-hover">
            Resend code
          </button>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}
