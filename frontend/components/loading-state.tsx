export function LoadingState({
  title = "Loading HRUSHE",
  description = "Please wait while the storefront gets ready.",
}: {
  title?: string;
  description?: string;
}) {
  const statusMessage = [title, description].filter(Boolean).join(". ");

  return (
    <div className="quiet-loader" role="status" aria-live="polite" aria-label={statusMessage}>
      <span className="quiet-loader__track" aria-hidden="true" />
      <span className="sr-only">{statusMessage}</span>
    </div>
  );
}

export function PageProgress({ label = "Loading page" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite">
      <span className="page-progress" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
