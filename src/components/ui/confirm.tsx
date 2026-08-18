"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Button } from "./button";

export interface ConfirmOptions {
  title?: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>(() => Promise.resolve(false));

/** `const confirm = useConfirm();` then `if (await confirm({ ... })) doThing();` */
export function useConfirm(): ConfirmFn {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{
    opts: ConfirmOptions;
    resolve: (ok: boolean) => void;
  } | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    return new Promise<boolean>((resolve) => setState({ opts, resolve }));
  }, []);

  const close = useCallback(
    (ok: boolean) => {
      setState((s) => {
        s?.resolve(ok);
        return null;
      });
    },
    [],
  );

  // Esc cancels, Enter confirms while the dialog is open.
  useEffect(() => {
    if (!state) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close(false);
      if (e.key === "Enter") close(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, close]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/55 backdrop-blur-[1px]"
            onClick={() => close(false)}
            aria-hidden
          />
          <div
            role="alertdialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-[400px] rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow)]"
          >
            {state.opts.title ? (
              <h2 className="text-[16px] font-bold tracking-tight">{state.opts.title}</h2>
            ) : null}
            <div className="mt-1.5 text-[13.5px] leading-relaxed text-ink-dim">
              {state.opts.message}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => close(false)}>
                {state.opts.cancelLabel ?? "Cancel"}
              </Button>
              <Button
                variant={state.opts.tone === "danger" ? "danger" : "primary"}
                size="sm"
                onClick={() => close(true)}
              >
                {state.opts.confirmLabel ?? "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}
