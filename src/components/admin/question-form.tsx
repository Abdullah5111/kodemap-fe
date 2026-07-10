"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  contentApi,
  DIFFICULTY_ORDER,
  DIFFICULTY_META,
  type Difficulty,
  type QuestionAdmin,
  type QuestionInput,
} from "@/lib/content";
import { apiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Select } from "@/components/ui/select";

interface Props {
  mode: "create" | "edit";
  question?: QuestionAdmin;
  onSaved: (q: QuestionAdmin) => void;
}

export function QuestionForm({ mode, question, onSaved }: Props) {
  const { data: topics } = useQuery({ queryKey: ["topics"], queryFn: contentApi.topics });
  const { data: languages } = useQuery({ queryKey: ["languages"], queryFn: contentApi.languages });

  const [title, setTitle] = useState(question?.title ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty>(question?.difficulty ?? "easy");
  const [score, setScore] = useState(question?.score ? String(question.score) : "");
  const [topic, setTopic] = useState(question?.topic ? String(question.topic) : "");
  const [statement, setStatement] = useState(question?.statement ?? "");
  const [inputFormat, setInputFormat] = useState(question?.input_format ?? "");
  const [outputFormat, setOutputFormat] = useState(question?.output_format ?? "");
  const [constraints, setConstraints] = useState(question?.constraints ?? "");
  const [timeLimit, setTimeLimit] = useState(String(question?.time_limit_ms ?? 1000));
  const [memoryLimit, setMemoryLimit] = useState(String(question?.memory_limit_kb ?? 128000));
  const [isActive, setIsActive] = useState(question?.is_active ?? false);
  const [langs, setLangs] = useState<Set<number>>(new Set(question?.allowed_languages ?? []));

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleLang(id: number) {
    setLangs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    setError(null);
    if (!title.trim()) return setError("A title is required.");
    if (!statement.trim()) return setError("A problem statement is required.");

    const payload: QuestionInput = {
      title: title.trim(),
      statement,
      input_format: inputFormat,
      output_format: outputFormat,
      constraints,
      difficulty,
      score: score ? Number(score) : 0, // 0 → backend fills default from difficulty
      topic: topic ? Number(topic) : null,
      time_limit_ms: Number(timeLimit) || 1000,
      memory_limit_kb: Number(memoryLimit) || 128000,
      allowed_languages: [...langs],
      is_active: isActive,
    };

    setSaving(true);
    try {
      const saved =
        mode === "create"
          ? await contentApi.createQuestion(payload)
          : await contentApi.updateQuestion(question!.id, payload);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't save the question."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-col gap-4">
        <Field label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sum of First N Numbers" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Difficulty">
            <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
              {DIFFICULTY_ORDER.map((d) => (
                <option key={d} value={d}>
                  {DIFFICULTY_META[d].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Score" hint={`Blank = ${DIFFICULTY_META[difficulty].score} (from difficulty)`}>
            <Input
              type="number"
              inputMode="numeric"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder={String(DIFFICULTY_META[difficulty].score)}
            />
          </Field>
          <Field label="Topic">
            <Select value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="">— none —</option>
              {topics?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Statement">
          <Textarea value={statement} onChange={(e) => setStatement(e.target.value)} className="min-h-[110px]" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Input format">
            <Textarea value={inputFormat} onChange={(e) => setInputFormat(e.target.value)} />
          </Field>
          <Field label="Output format">
            <Textarea value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} />
          </Field>
        </div>

        <Field label="Constraints">
          <Textarea value={constraints} onChange={(e) => setConstraints(e.target.value)} className="font-mono text-[12.5px]" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Time limit (ms)">
            <Input type="number" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} />
          </Field>
          <Field label="Memory limit (KB)">
            <Input type="number" value={memoryLimit} onChange={(e) => setMemoryLimit(e.target.value)} />
          </Field>
        </div>

        <div>
          <span className="font-mono text-[12px] text-ink-dim">Allowed languages</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {languages?.map((l) => {
              const on = langs.has(l.id);
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => toggleLang(l.id)}
                  className={
                    "rounded-full border px-3 py-1.5 font-mono text-[12px] transition-colors " +
                    (on
                      ? "border-ember-line bg-ember-soft text-ember"
                      : "border-line text-ink-dim hover:text-ink")
                  }
                >
                  {l.name}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[12px] text-ink-mute">None selected = all active languages allowed.</p>
        </div>

        <label className="flex items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="size-4 accent-[var(--ember)]"
          />
          <span>
            Live <span className="text-ink-mute">— visible to learners (uncheck to keep as draft)</span>
          </span>
        </label>

        {error ? (
          <p className="rounded-[9px] border border-bad/40 bg-bad-soft px-3 py-2 text-[13px] text-bad">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : mode === "create" ? "Create question" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
