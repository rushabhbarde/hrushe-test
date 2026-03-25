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
    <div className="empty-shell rounded-[2rem] p-8 sm:p-10">
      <p className="text-2xl font-semibold">{title}</p>
      <p className="mt-3 max-w-xl text-[var(--muted)]">{description}</p>
      {ctaHref && ctaLabel ? (
        <Link
          href={ctaHref}
          className="button-primary mt-6 inline-flex rounded-full px-5 py-3 transition"
        >
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
