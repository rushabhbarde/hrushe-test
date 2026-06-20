type TrustBadge = {
  label: string;
  detail?: string;
};

const defaultBadges: TrustBadge[] = [
  { label: "Secure payment", detail: "Razorpay protected" },
  { label: "Tracked dispatch", detail: "Updates shared by email" },
  { label: "India-wide delivery", detail: "5–10 business days" },
  { label: "Customer support", detail: "Mon–Sat, 10 AM–7 PM" },
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
        compact ? "grid-cols-2 text-[0.68rem]" : "grid-cols-2 text-[0.72rem] sm:grid-cols-4"
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
