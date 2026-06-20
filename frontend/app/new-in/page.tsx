"use client";

import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
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
      <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-col gap-7 border-b border-[var(--border)] pb-8 sm:pb-10 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="New In"
            eyebrowClassName="text-[var(--accent)]"
            title="Fresh pieces from the latest drop."
            description={
              isFallbackEdit
                ? "A live edit of the newest available HRUSHE pieces while the next marked drop is prepared."
                : "The newest styles added to the collection, gathered into one clean edit."
            }
          />
          <div className="flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="button-secondary inline-flex min-h-11 items-center px-5 text-[0.72rem] font-medium uppercase tracking-[0.16em]"
            >
              Explore all products
            </Link>
            <Link
              href="/collection/oversized"
              className="button-primary inline-flex min-h-11 items-center px-5 text-[0.72rem] font-medium uppercase tracking-[0.16em]"
            >
              Oversized
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
                <span>{isFallbackEdit ? "Newest active edit" : "Drop-ready styles"}</span>
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
