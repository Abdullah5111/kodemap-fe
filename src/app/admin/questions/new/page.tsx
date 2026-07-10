"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { QuestionForm } from "@/components/admin/question-form";

export default function NewQuestionPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-[820px]">
      <Link href="/admin/questions" className="font-mono text-[12px] text-ink-mute hover:text-ember">
        ← question bank
      </Link>
      <h1 className="mt-2 mb-4 text-[clamp(20px,3vw,25px)] font-bold tracking-tight">New question</h1>
      <QuestionForm
        mode="create"
        onSaved={(q) => router.replace(`/admin/questions/${q.id}/edit`)}
      />
      <p className="mt-3 text-[12.5px] text-ink-mute">
        Save the question first — then you can add test cases.
      </p>
    </div>
  );
}
