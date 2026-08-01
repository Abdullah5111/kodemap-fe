"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary for errors thrown in the root layout itself. It must
 * render its own <html>/<body> because it replaces the entire document.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          background: "#0f0e0c",
          color: "#e8e4dc",
          margin: 0,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420, padding: 24 }}>
          <h1 style={{ fontSize: 18, fontWeight: 600 }}>The app hit a fatal error.</h1>
          <p style={{ fontSize: 14, opacity: 0.7, marginTop: 8 }}>
            Please reload. If it persists, try again in a moment.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 16,
              borderRadius: 6,
              border: 0,
              background: "#d9612e",
              color: "#fff",
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
