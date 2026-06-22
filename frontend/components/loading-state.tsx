export function LoadingState({
  title = "Loading",
  description = "Please wait while we prepare this view.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="loading-shell border border-[var(--border)] bg-[var(--surface)] px-6 py-10 sm:px-8 sm:py-12" role="status" aria-live="polite">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow text-[var(--muted)]">Loading</p>
        <h2 className="mt-3 text-2xl font-medium uppercase tracking-[-0.03em] sm:text-3xl">{title}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
          {description}
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3" aria-hidden="true">
          <span className="loading-line h-12" />
          <span className="loading-line h-12" />
          <span className="loading-line h-12" />
        </div>
      </div>
    </div>
  );
}
