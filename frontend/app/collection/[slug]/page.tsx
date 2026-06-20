"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { ProductListingGrid, ProductListingSkeleton } from "@/components/product-listing-grid";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  formatCollectionLabel,
  getCollectionLabelFromSlug,
  getCollectionProducts,
  getNewInProducts,
} from "@/lib/catalog";
import { useStorefrontData } from "@/lib/use-storefront";

export default function CollectionPage() {
  const params = useParams<{ slug: string }>();
  const { products, loading } = useStorefrontData();
  const collectionSlug = params.slug || "";
  const matchedCategory = getCollectionLabelFromSlug(collectionSlug, products);
  const displayCategory = matchedCategory || formatCollectionLabel(collectionSlug) || "Collection";
  const visibleProducts = matchedCategory
    ? getCollectionProducts(products, matchedCategory)
    : [];
  const relatedProducts = getNewInProducts(products, { limit: 4 });

  const collectionDescription =
    visibleProducts.length > 0
      ? `A focused ${displayCategory.toLowerCase()} edit for customers who already know the type of piece they want.`
      : `The ${displayCategory.toLowerCase()} edit is being prepared. Explore related HRUSHE essentials while this collection is restocked.`;

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6 lg:px-8">
        {matchedCategory ? (
          <>
            <SectionHeading
              eyebrow="Collection"
              eyebrowClassName="text-[var(--accent)]"
              title={`${displayCategory} collection`}
              description={collectionDescription}
            />
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="button-secondary px-5 py-3 transition">
                Back to shop
              </Link>
              <Link href="/search" className="button-secondary px-5 py-3 transition">
                Search products
              </Link>
            </div>
            <div className="mt-10">
              {loading ? (
                <ProductListingSkeleton count={8} />
              ) : visibleProducts.length === 0 ? (
                <div className="space-y-10">
                  <EmptyState
                    title={`${displayCategory} is coming soon.`}
                    description="This collection does not have live products yet. The page is ready, and products will appear here as soon as the edit is published."
                    ctaHref="/shop"
                    ctaLabel="Explore all products"
                  />
                  {relatedProducts.length > 0 ? (
                    <section aria-labelledby="related-collection-products">
                      <div className="mb-5 flex flex-col gap-2 border-t border-[var(--border)] pt-8 text-[0.76rem] uppercase tracking-[0.16em] text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
                        <h2 id="related-collection-products" className="font-medium text-[var(--foreground)]">
                          You may also like
                        </h2>
                        <span>Newest available pieces</span>
                      </div>
                      <ProductListingGrid products={relatedProducts} />
                    </section>
                  ) : null}
                </div>
              ) : (
                <>
                  <div className="mb-5 flex flex-col gap-2 text-[0.76rem] uppercase tracking-[0.16em] text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
                    <span>{visibleProducts.length} pieces available</span>
                    <span>Filtered by collection</span>
                  </div>
                  <ProductListingGrid products={visibleProducts} />
                </>
              )}
            </div>
          </>
        ) : loading ? (
          <ProductListingSkeleton count={8} />
        ) : (
          <EmptyState
            title={`${displayCategory} is not live yet.`}
            description="This edit is not available yet. Browse the full catalog while the collection page is prepared."
            ctaHref="/shop"
            ctaLabel="Explore all products"
          />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
