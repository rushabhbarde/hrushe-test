"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { toCollectionSlug } from "@/lib/catalog";
import { useStorefrontData } from "@/lib/use-storefront";

export default function CollectionPage() {
  const params = useParams<{ slug: string }>();
  const { products } = useStorefrontData();

  const matchedCategory = Array.from(
    new Set(
      products.flatMap((product) =>
        product.categories && product.categories.length > 0
          ? product.categories
          : [product.category]
      )
    )
  ).find((category) => toCollectionSlug(category) === params.slug);

  const visibleProducts = matchedCategory
    ? products.filter((product) =>
        (product.categories && product.categories.length > 0
          ? product.categories
          : [product.category]
        ).includes(matchedCategory)
      )
    : [];

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6 lg:px-8">
        {matchedCategory ? (
          <>
            <SectionHeading
              eyebrow="Collection page"
              title={`${matchedCategory} collection`}
              description="A focused category edit for customers who already know the type of piece they want."
            />
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="button-secondary rounded-full px-5 py-3 transition">
                Back to shop
              </Link>
              <Link href="/search" className="button-secondary rounded-full px-5 py-3 transition">
                Search products
              </Link>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title="Collection not found."
            description="This edit is not available yet. Browse the full catalog instead."
            ctaHref="/shop"
            ctaLabel="View all products"
          />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
