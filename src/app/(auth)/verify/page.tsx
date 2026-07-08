import Link from "next/link";
export default function Page() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-7 shadow-[var(--shadow)]">
      <h1 className="text-[22px] font-bold tracking-tight">Verify your email</h1>
      <p className="mt-1.5 text-sm text-ink-dim">
        We sent a 6-digit code to your email. The OTP entry screen lands in the next build.
      </p>
      <Link href="/login" className="mt-6 inline-block font-semibold text-ember hover:text-ember-hover">
        ← Back to sign in
      </Link>
    </div>
  );
}
