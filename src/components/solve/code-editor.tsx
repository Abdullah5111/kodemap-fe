"use client";

import Editor, { type BeforeMount } from "@monaco-editor/react";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/feedback";

type Theme = "dark" | "light";

function readTheme(): Theme {
  return (document.documentElement.getAttribute("data-theme") as Theme) ?? "dark";
}

const defineThemes: BeforeMount = (monaco) => {
  monaco.editor.defineTheme("kodemap-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "F65F2E" },
      { token: "string", foreground: "4CB98A" },
      { token: "comment", foreground: "8A7C6A", fontStyle: "italic" },
      { token: "number", foreground: "CBA47D" },
      { token: "type", foreground: "CBA47D" },
      { token: "delimiter", foreground: "B7A896" },
    ],
    colors: {
      "editor.background": "#0C0A08",
      "editor.foreground": "#F4ECE2",
      "editorLineNumber.foreground": "#6B5F50",
      "editorLineNumber.activeForeground": "#CBA47D",
      "editor.lineHighlightBackground": "#141009",
      "editor.selectionBackground": "#2E2620",
      "editorCursor.foreground": "#F65F2E",
      "editorIndentGuide.background1": "#241D16",
    },
  });
  monaco.editor.defineTheme("kodemap-light", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "E24E1B" },
      { token: "string", foreground: "2E9E6E" },
      { token: "comment", foreground: "867868", fontStyle: "italic" },
      { token: "number", foreground: "A9825B" },
      { token: "type", foreground: "A9825B" },
    ],
    colors: {
      "editor.background": "#FFFFFF",
      "editor.foreground": "#241C13",
      "editorLineNumber.foreground": "#B9AC98",
      "editor.lineHighlightBackground": "#F7F3ED",
      "editorCursor.foreground": "#E24E1B",
    },
  });
};

export function CodeEditor({
  language,
  value,
  onChange,
}: {
  language: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(readTheme());
    const obs = new MutationObserver(() => setTheme(readTheme()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  return (
    <Editor
      language={language}
      value={value}
      onChange={(v) => onChange(v ?? "")}
      beforeMount={defineThemes}
      theme={theme === "dark" ? "kodemap-dark" : "kodemap-light"}
      height="100%"
      loading={
        <div className="flex items-center gap-2 p-4 font-mono text-sm text-ink-mute">
          <Spinner /> Loading editor…
        </div>
      }
      options={{
        fontSize: 13,
        fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', Menlo, Consolas, monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        padding: { top: 12, bottom: 12 },
        lineNumbersMinChars: 3,
        tabSize: 4,
        automaticLayout: true,
        renderLineHighlight: "line",
        smoothScrolling: true,
        cursorBlinking: "smooth",
        scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
      }}
    />
  );
}
