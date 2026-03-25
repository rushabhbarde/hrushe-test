"use client";

import { AdminGuard } from "@/components/admin-guard";
import { AdminProductForm } from "@/components/admin-product-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { Product } from "@/lib/catalog";
import { useStorefrontData } from "@/lib/use-storefront";
import { useParams, useRouter } from "next/navigation";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { products, updateProduct, loading } = useStorefrontData();
  const product = products.find((item) => item.id === params.id || item.slug === params.id);

  const handleSubmit = async (nextProduct: Product) => {
    if (!product) {
      return;
    }

    await updateProduct(product.id, nextProduct);
    router.push("/admin/products");
  };

  return (
    <div className="page-shell">
      <SiteHeader />
      <AdminGuard>
        <main className="mx-auto w-full max-w-[1600px] px-5 py-10 sm:px-8 lg:px-10">
          {loading ? (
            <div className="grain-card rounded-[2rem] p-8 text-sm text-[var(--muted)]">
              Loading product...
            </div>
          ) : product ? (
            <AdminProductForm
              initialProduct={product}
              submitLabel="Update product"
              title="Edit launch product."
              description="Update product details, visibility flags, or replace the image set for this item."
              onSubmit={handleSubmit}
            />
          ) : (
            <div className="grain-card rounded-[2rem] p-8">
              <p className="eyebrow text-[var(--accent)]">Admin product panel</p>
              <h1 className="display-font mt-3 text-4xl">Product not found.</h1>
              <p className="mt-3 text-sm text-[var(--muted)]">
                This product may have been deleted or the link is outdated.
              </p>
            </div>
          )}
        </main>
      </AdminGuard>
      <SiteFooter />
    </div>
  );
}
