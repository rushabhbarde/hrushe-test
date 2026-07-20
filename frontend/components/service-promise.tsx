const serviceItems = [
  { label: "Dispatch", detail: "Within 1–3 business days" },
  { label: "Returns", detail: "7 days from delivery" },
  { label: "Size exchange", detail: "One exchange at no charge" },
  { label: "Payment", detail: "Secured by Razorpay" },
  { label: "Support", detail: "WhatsApp and email" },
] as const;

export function ServicePromise({
  compact = false,
  borderless = false,
}: {
  compact?: boolean;
  borderless?: boolean;
}) {
  return (
    <div
      className={`grid ${
        borderless ? "gap-3" : "border-l border-t border-[var(--border)]"
      } ${
        compact ? "grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-5"
      }`}
      aria-label="HRUSHE service promise"
    >
      {serviceItems.map((item) => (
        <div
          key={item.label}
          className={
            borderless
              ? "bg-[#f6f6f6] px-4 py-4"
              : "border-b border-r border-[var(--border)] bg-[var(--surface)] px-4 py-4"
          }
        >
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[var(--foreground)]">
            {item.label}
          </p>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{item.detail}</p>
        </div>
      ))}
    </div>
  );
}
