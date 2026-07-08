import Link from "next/link";
export default function Page() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-7 shadow-[var(--shadow)]">
      <h1 className="text-[22px] font-bold tracking-tight">Create your account</h1>
      <p className="mt-1.5 text-sm text-ink-dim">
        Registration (with email OTP verification) is wired up in the next build.
      </p>
      <Link href="/login" className="mt-6 inline-block font-semibold text-ember hover:text-ember-hover">
        ← Back to sign in
      </Link>
    </div>
  );
}
