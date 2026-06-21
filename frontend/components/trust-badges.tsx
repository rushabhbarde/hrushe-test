type TrustBadge = {
  label: string;
  detail?: string;
};

const defaultBadges: TrustBadge[] = [
  { label: "Secure payment", detail: "Razorpay protected" },
  { label: "Dispatch", detail: "Within 1–3 business days" },
  { label: "7-day returns", detail: "From delivery" },
  { label: "Size exchange", detail: "One exchange at no charge" },
  { label: "Support", detail: "WhatsApp and email" },
];

function TrustMark() {
  return (
    <span
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center border border-current text-[0.68rem] leading-none"
      aria-hidden="true"
    >
      ✓
    </span>
  );
}

export function TrustBadges({
  items = defaultBadges,
  compact = false,
}: {
  items?: TrustBadge[];
  compact?: boolean;
}) {
  return (
    <div
      className={`grid gap-2 ${
        compact ? "grid-cols-2 text-[0.68rem]" : "grid-cols-2 text-[0.72rem] sm:grid-cols-3 lg:grid-cols-5"
      }`}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="flex min-h-12 items-center gap-2 border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)]"
        >
          <TrustMark />
          <span className="min-w-0">
            <span className="block font-semibold uppercase tracking-[0.12em]">
              {item.label}
            </span>
            {item.detail && !compact ? (
              <span className="mt-0.5 block text-[0.68rem] leading-4 text-[var(--muted)]">
                {item.detail}
              </span>
            ) : null}
          </span>
        </div>
      ))}
    </div>
  );
}
