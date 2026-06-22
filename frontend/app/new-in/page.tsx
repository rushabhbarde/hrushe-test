"use client";

import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductListingGrid, ProductListingSkeleton } from "@/components/product-listing-grid";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getNewInProducts, isVisibleStorefrontProduct } from "@/lib/catalog";
import { useStorefrontData } from "@/lib/use-storefront";

export default function NewInPage() {
  const { products, loading } = useStorefrontData();
  const flaggedNewInCount = products.filter(
    (product) => isVisibleStorefrontProduct(product) && (product.newIn || product.newArrival)
  ).length;
  const newInProducts = getNewInProducts(products);
  const isFallbackEdit = flaggedNewInCount === 0 && newInProducts.length > 0;

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
        <div className="mb-7">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "New In" }]} />
        </div>
        <div className="flex flex-col gap-8 border-b border-[var(--border)] pb-10 sm:pb-14 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="New In"
            eyebrowClassName="text-[var(--accent)]"
            title="The latest edit."
            description={
              isFallbackEdit
                ? "The newest available HRUSHE pieces, gathered into one considered edit."
                : "New silhouettes and colours, presented without noise."
            }
          />
          <div className="flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="button-secondary inline-flex min-h-11 items-center px-5 text-[0.72rem] font-medium uppercase tracking-[0.16em]"
            >
              View collection
            </Link>
            <Link
              href="/collection/oversized"
              className="button-primary inline-flex min-h-11 items-center px-5 text-[0.72rem] font-medium uppercase tracking-[0.16em]"
            >
              Discover the fit
            </Link>
          </div>
        </div>

        <section className="mt-8 sm:mt-10">
          {loading ? (
            <ProductListingSkeleton count={10} />
          ) : newInProducts.length === 0 ? (
            <EmptyState
              title="New pieces are being prepared."
              description="The next HRUSHE edit is not live yet. Browse the full catalog for available essentials and oversized fits."
              ctaHref="/shop"
              ctaLabel="Browse the shop"
            />
          ) : (
            <>
              <div className="mb-5 flex flex-col gap-2 text-[0.76rem] uppercase tracking-[0.16em] text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
                <span>{newInProducts.length} pieces available</span>
                <span>{isFallbackEdit ? "Current edit" : "Summer 2026"}</span>
              </div>
              <ProductListingGrid products={newInProducts} />
            </>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
