import Link from "next/link";

export function EmptyState({
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="empty-shell p-8 sm:p-10" role="status">
      <p className="eyebrow text-[var(--muted)]">Current edit</p>
      <p className="mt-3 max-w-[18ch] text-[2rem] font-semibold uppercase leading-[0.96] tracking-[0] text-[var(--foreground)] sm:text-[2.6rem]">
        {title}
      </p>
      <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--muted)] sm:text-[0.98rem]">
        {description}
      </p>
      {ctaHref && ctaLabel ? (
        <Link
          href={ctaHref}
          className="button-primary mt-6 inline-flex items-center px-5 py-3 text-[0.72rem] font-medium uppercase tracking-[0.16em] transition"
        >
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
