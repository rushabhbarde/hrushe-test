export function LoadingState({
  title = "Loading",
  description = "Please wait while we prepare this view.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="grain-card rounded-[2rem] p-8">
      <div className="flex items-center gap-4">
        <span className="loading-pulse h-11 w-11 rounded-full bg-black/8" />
        <div className="space-y-2">
          <p className="text-lg font-semibold">{title}</p>
          <p className="text-sm text-[var(--muted)]">{description}</p>
        </div>
      </div>
    </div>
  );
}
