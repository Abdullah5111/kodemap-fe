"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Route-level error boundary. Without this, any render-time exception (e.g. an
 * unexpected verdict status) would white-screen the whole app. Here it's caught
 * and the user gets a way back.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface it for debugging; never swallow silently.
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[60vh] place-items-center px-6">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <span className="font-mono text-sm text-ink-mute">Something broke</span>
        <h1 className="text-lg font-semibold">This page hit an unexpected error.</h1>
        <p className="text-sm text-ink-mute">
          It&apos;s not you — the page failed to render. Try again, and if it keeps
          happening head back to your roadmap.
        </p>
        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={reset}
            className="rounded-md bg-ember px-4 py-2 font-mono text-[13px] font-semibold text-white"
          >
            Try again
          </button>
          <Link
            href="/roadmap"
            className="font-mono text-[13px] text-ink-mute hover:text-ember"
          >
            ← roadmap
          </Link>
        </div>
      </div>
    </div>
  );
}
