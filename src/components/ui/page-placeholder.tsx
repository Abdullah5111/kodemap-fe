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
      <p className="font-mono text-[12px] text-ink-mute">{eyebrow}</p>
      <h1 className="mt-1 text-[clamp(21px,3vw,27px)] font-bold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-[60ch] text-sm text-ink-dim">{description}</p>
      <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-line border-l-[3px] border-l-ember bg-surface px-4 py-3.5 text-[13px] text-ink-dim">
        <span className="rounded-md bg-ember-soft px-2 py-0.5 font-mono text-[11px] font-semibold text-ember">
          next build
        </span>
        The auth foundation and app shells are live — this screen is wired up next.
      </div>
    </div>
  );
}
