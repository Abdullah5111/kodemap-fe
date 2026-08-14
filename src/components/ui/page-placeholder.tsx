import { PageHeader } from "./page-header";

export function PagePlaceholder({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-line border-l-[3px] border-l-ember bg-surface px-4 py-3.5 text-[13px] text-ink-dim">
        <span className="rounded-md bg-ember-soft px-2 py-0.5 font-mono text-[11px] font-semibold text-ember">
          next build
        </span>
        The auth foundation and app shells are live — this screen is wired up next.
      </div>
    </div>
  );
}
