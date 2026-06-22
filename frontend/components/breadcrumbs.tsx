import Link from "next/link";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[0.66rem] uppercase tracking-[0.14em] text-[var(--muted)]">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, index) => {
          const current = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-2">
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {item.href && !current ? (
                <Link href={item.href} className="min-h-11 content-center hover:text-[var(--foreground)]">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={current ? "page" : undefined} className="truncate text-[var(--foreground)]">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
