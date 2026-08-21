"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { LessonBlock } from "@/lib/content";
import { solveApi } from "@/lib/solve";
import { useAuth } from "@/components/auth-provider";
import { ExercisePanel } from "@/components/solve/exercise-panel";
import { Loading } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";

// Friendly-first tab order; only languages a lesson actually provides are shown.
const LANG_ORDER = ["python", "javascript", "cpp", "java"] as const;
const LANG_LABEL: Record<string, string> = {
  python: "Python",
  javascript: "JavaScript",
  cpp: "C++",
  java: "Java",
};
const LANG_PREF_KEY = "kodemap:lesson-lang";

// ---- language context -----------------------------------------------------
type LangCtx = { lang: string; setLang: (l: string) => void; langs: string[]; trackSlug: string };
const LessonLangContext = createContext<LangCtx | null>(null);

function useLessonLang() {
  const ctx = useContext(LessonLangContext);
  if (!ctx) throw new Error("useLessonLang outside provider");
  return ctx;
}

function availableLangs(blocks: LessonBlock[]): string[] {
  const present = new Set<string>();
  for (const b of blocks) if (b.t === "code") Object.keys(b.variants).forEach((k) => present.add(k));
  const ordered = LANG_ORDER.filter((l) => present.has(l));
  return ordered.length ? ordered : ["python"];
}

export function LessonLangProvider({
  blocks,
  trackSlug,
  children,
}: {
  blocks: LessonBlock[];
  trackSlug: string;
  children: ReactNode;
}) {
  const langs = useMemo(() => availableLangs(blocks), [blocks]);
  const [lang, setLangState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(LANG_PREF_KEY);
      if (saved && langs.includes(saved)) return saved;
    }
    return langs[0];
  });
  const setLang = (l: string) => {
    setLangState(l);
    try {
      window.localStorage.setItem(LANG_PREF_KEY, l);
    } catch {
      /* best-effort */
    }
  };
  return (
    <LessonLangContext.Provider value={{ lang, setLang, langs, trackSlug }}>
      {children}
    </LessonLangContext.Provider>
  );
}

/** The sticky per-lesson language switcher — one choice drives every code block. */
export function LangTabs() {
  const { lang, setLang, langs } = useLessonLang();
  if (langs.length < 2) return null;
  return (
    <div className="sticky top-0 z-10 -mx-1 flex gap-1 rounded-xl border border-line bg-surface/85 p-1 backdrop-blur">
      {langs.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={cn(
            "flex-1 rounded-lg px-3 py-1.5 font-mono text-[12.5px] font-semibold transition-colors",
            l === lang
              ? "bg-brand-grad-btn text-white"
              : "text-ink-mute hover:bg-elevated hover:text-ink",
          )}
        >
          {LANG_LABEL[l] ?? l}
        </button>
      ))}
    </div>
  );
}

// ---- tiny inline markdown (**bold**, `code`) ------------------------------
function InlineMd({ text }: { text: string }) {
  // Split on **bold** and `code`, keeping the delimiters.
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**"))
          return <strong key={i} className="font-semibold text-ink">{p.slice(2, -2)}</strong>;
        if (p.startsWith("`") && p.endsWith("`"))
          return (
            <code key={i} className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[0.86em] text-ember">
              {p.slice(1, -1)}
            </code>
          );
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

function TabbedCode({ variants, note }: { variants: Record<string, string>; note?: string }) {
  const { lang } = useLessonLang();
  const code = variants[lang] ?? variants[Object.keys(variants)[0]] ?? "";
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <div className="flex items-center justify-between border-b border-line bg-elevated px-3 py-1.5">
        <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink-mute">
          {LANG_LABEL[lang] ?? lang}
        </span>
        {note ? <span className="font-mono text-[10.5px] text-ink-mute">{note}</span> : null}
      </div>
      <pre className="overflow-x-auto bg-ground p-4 font-mono text-[13px] leading-[1.75] text-ink-dim">
        {code}
      </pre>
    </div>
  );
}

const NOTE_STYLE = {
  tip: "border-l-ok bg-ok-soft/40",
  note: "border-l-tan bg-tan-soft/40",
  warn: "border-l-warn bg-warn-soft/40",
} as const;

// ---- inline exercise (self-fetching) --------------------------------------
function LessonExercise({ slug }: { slug: string }) {
  const { trackSlug } = useLessonLang();
  const qc = useQueryClient();
  const { refresh } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["exercise", slug],
    queryFn: () => solveApi.question(slug),
  });

  if (isLoading) return <div className="rounded-2xl border border-line bg-surface p-5"><Loading label="Loading exercise…" /></div>;
  if (!data || !data.exercise) return null;

  return (
    <div className="rounded-2xl border border-ember-line/60 bg-ember-soft/20 p-1">
      <div className="px-4 pt-3 font-mono text-[10.5px] uppercase tracking-wider text-ember">
        Try it yourself
      </div>
      <div className="p-3">
        <ExercisePanel
          slug={slug}
          exercise={data.exercise}
          alreadySolved={data.is_solved}
          locked={!data.is_unlocked}
          onSolved={() => {
            void refresh();
            qc.invalidateQueries({ queryKey: ["exercise", slug] });
            qc.invalidateQueries({ queryKey: ["track", trackSlug] });
            qc.invalidateQueries({ queryKey: ["badges"] });
            qc.invalidateQueries({ queryKey: ["my-stats"] });
          }}
        />
      </div>
    </div>
  );
}

export function LessonBlocks({ blocks }: { blocks: LessonBlock[] }) {
  return (
    <div className="flex flex-col gap-5">
      {blocks.map((b, i) => {
        switch (b.t) {
          case "h":
            return (
              <h2 key={i} className="mt-2 text-[19px] font-bold tracking-tight">
                {b.text}
              </h2>
            );
          case "p":
            return (
              <p key={i} className="max-w-[68ch] text-[14.5px] leading-relaxed text-ink-dim">
                <InlineMd text={b.md} />
              </p>
            );
          case "note":
            return (
              <div
                key={i}
                className={cn("max-w-[68ch] rounded-xl border border-line border-l-[3px] p-3.5 text-[13.5px] leading-relaxed text-ink-dim", NOTE_STYLE[b.tone])}
              >
                <InlineMd text={b.md} />
              </div>
            );
          case "code":
            return <TabbedCode key={i} variants={b.variants} note={b.note} />;
          case "exercise":
            return <LessonExercise key={i} slug={b.slug} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
