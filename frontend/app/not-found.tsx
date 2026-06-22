import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="lux-page flex items-center py-16">
        <div className="lux-container">
          <div className="empty-shell max-w-3xl p-8 sm:p-12">
            <p className="eyebrow text-[var(--muted)]">404</p>
            <h1 className="mt-4 text-3xl font-medium uppercase tracking-[-0.04em] sm:text-5xl">The page is not in this edit.</h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[var(--muted)] sm:text-base">The link may have moved, or the product is no longer available.</p>
            <Link href="/shop" className="button-primary mt-8 inline-flex items-center px-6 text-xs font-semibold uppercase tracking-[0.12em]">Explore the collection</Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
