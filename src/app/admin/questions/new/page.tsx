"use client";

import { BackLink } from "@/components/ui/back-link";
import { useRouter } from "next/navigation";
import { QuestionForm } from "@/components/admin/question-form";

export default function NewQuestionPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-[820px]">
      <BackLink href="/admin/questions">Question bank</BackLink>
      <h1 className="mt-2 mb-4 text-[clamp(22px,3vw,28px)] font-extrabold tracking-tight">New question</h1>
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
