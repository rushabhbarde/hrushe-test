"use client";

import { AdminGuard } from "@/components/admin-guard";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useStorefrontData } from "@/lib/use-storefront";

export default function AdminProductsPage() {
  const { products, deleteProduct, loading } = useStorefrontData();

  return (
    <div className="page-shell">
      <SiteHeader />
      <AdminGuard>
        <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow text-[var(--accent)]">Admin products</p>
              <h1 className="display-font mt-3 text-5xl">Current catalog.</h1>
            </div>
            <Link href="/admin/add-product" className="button-primary inline-flex rounded-full px-5 py-3 transition">
              Add new product
            </Link>
          </div>

          <div className="mt-8 space-y-4">
            {loading ? (
              <div className="grain-card rounded-[2rem] p-6 text-sm text-[var(--muted)]">
                Loading products...
              </div>
            ) : products.length === 0 ? (
              <div className="grain-card rounded-[2rem] p-6 text-sm text-[var(--muted)]">
                No products yet. Add your first launch item.
              </div>
            ) : (
              products.map((product) => (
                <div key={product.id} className="grain-card rounded-[2rem] p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex gap-4">
                      <div className="relative h-28 w-24 overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-strong)]">
                        {product.images[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xl font-semibold">{product.name}</p>
                          {product.featured ? (
                            <span className="rounded-full bg-black px-3 py-1 text-xs text-white">
                              Featured
                            </span>
                          ) : null}
                          {product.newArrival ? (
                            <span className="rounded-full border border-[var(--accent)] px-3 py-1 text-xs text-[var(--accent)]">
                              New arrival
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm text-[var(--muted)]">
                          {product.category} · {product.slug || product.id}
                        </p>
                        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
                          {product.description}
                        </p>
                        <p className="mt-3 text-sm text-[var(--muted)]">
                          Sizes: {product.sizes.join(", ") || "Not set"}
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          Colors: {product.colors.join(", ") || "Not set"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-3 lg:items-end">
                      <span className="text-lg font-semibold">Rs. {product.price}</span>
                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`/admin/products/${product.slug || product.id}`}
                          className="rounded-full border border-[var(--border)] px-4 py-2 text-sm"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!window.confirm(`Delete ${product.name}?`)) {
                              return;
                            }

                            await deleteProduct(product.id);
                          }}
                          className="rounded-full px-4 py-2 text-sm text-[var(--accent)]"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </AdminGuard>
      <SiteFooter />
    </div>
  );
}
