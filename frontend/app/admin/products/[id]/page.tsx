"use client";

import { useParams, useRouter } from "next/navigation";
import { AdminProductForm } from "@/components/admin-product-form";
import { AdminShell } from "@/components/admin-shell";
import { AdminPanel, AdminSectionLabel } from "@/components/admin-ui";
import type { Product } from "@/lib/catalog";
import { useStorefrontData } from "@/lib/use-storefront";

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
    <AdminShell>
      {loading ? (
        <AdminPanel>
          <p className="text-sm text-[var(--muted)]">Loading product...</p>
        </AdminPanel>
      ) : product ? (
        <AdminProductForm
          initialProduct={product}
          submitLabel="Update product"
          title="Edit launch product."
          description="Update imagery, pricing, categories, and merchandising flags without leaving the catalog workspace."
          onSubmit={handleSubmit}
        />
      ) : (
        <AdminPanel>
          <AdminSectionLabel>Catalog</AdminSectionLabel>
          <h1 className="display-font mt-3 text-4xl">Product not found.</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">
            This product may have been deleted or the link is outdated.
          </p>
        </AdminPanel>
      )}
    </AdminShell>
  );
}
