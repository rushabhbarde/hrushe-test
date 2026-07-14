import Image from "next/image";

export function LoadingState({
  title = "Loading HRUSHE",
  description = "Please wait while the storefront gets ready.",
}: {
  title?: string;
  description?: string;
}) {
  const statusMessage = [title, description].filter(Boolean).join(". ");

  return (
    <div
      className="loading-shell border border-[var(--border)] bg-[var(--surface)] px-6 py-14 sm:px-8 sm:py-16"
      role="status"
      aria-live="polite"
      aria-label={statusMessage}
    >
      <div className="hrushe-symbol-loader" aria-hidden="true">
        <span className="hrushe-symbol-loader__mark">
          <Image
            src="/NEW_LOGO_SYMB.png"
            alt=""
            width={96}
            height={96}
            priority
          />
        </span>
        <span className="hrushe-symbol-loader__rule" />
      </div>
      <span className="sr-only">{statusMessage}</span>
    </div>
  );
}
