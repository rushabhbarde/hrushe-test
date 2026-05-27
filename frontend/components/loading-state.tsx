export function LoadingState({
  title = "Loading",
  description = "Please wait while we prepare this view.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="loading-shell relative overflow-hidden px-6 py-10 sm:px-8 sm:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(17,17,17,0.06),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,255,255,0.88))]" />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
        <div className="loading-mark relative flex h-20 w-20 items-center justify-center border border-[var(--border)] sm:h-24 sm:w-24">
          <span className="loading-ring absolute inset-0 border border-black/15" />
          <span className="loading-ring-delayed absolute inset-[8px] border border-black/10" />
          <span className="loading-core h-2.5 w-2.5 bg-[var(--foreground)]" />
        </div>
        <p className="eyebrow mt-6 text-[var(--muted)]">Loading</p>
        <h2 className="display-font mt-3 text-3xl sm:text-4xl">{title}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
          {description}
        </p>
        <div className="mt-8 grid w-full gap-3 sm:grid-cols-3">
          <span className="loading-line h-14" />
          <span className="loading-line h-14" />
          <span className="loading-line h-14" />
        </div>
      </div>
    </div>
  );
}
