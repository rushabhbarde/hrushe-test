"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AdminProductForm,
  type AdminProductFormSubmit,
} from "@/components/admin-product-form";
import { AdminShell } from "@/components/admin-shell";
import { AdminPanel, AdminSectionLabel } from "@/components/admin-ui";
import { apiRequest } from "@/lib/api";
import type { Product } from "@/lib/catalog";
import { resolveCatalogCategories, resolveProductAdminMeta } from "@/lib/admin-workspace";
import { useAdminWorkspace } from "@/lib/use-admin-workspace";
import { useStorefrontData } from "@/lib/use-storefront";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { products, updateProduct, loading } = useStorefrontData({ admin: true });
  const { workspace, saveWorkspace } = useAdminWorkspace();
  const listProduct = useMemo(
    () => products.find((item) => item.id === params.id || item.slug === params.id),
    [params.id, products]
  );
  const [product, setProduct] = useState<Product | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const categoryOptions = useMemo(
    () =>
      resolveCatalogCategories(workspace, product ? [product.category, ...(product.categories || [])] : []),
    [product, workspace]
  );

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!listProduct) {
      setProduct(null);
      return;
    }

    let active = true;
    setDetailLoading(true);

    const loadProductDetails = async () => {
      try {
        const fullProduct = await apiRequest<Product>(`/products/${params.id}?admin=true`);

        if (active) {
          setProduct(fullProduct);
        }
      } catch {
        if (active) {
          setProduct(listProduct);
        }
      } finally {
        if (active) {
          setDetailLoading(false);
        }
      }
    };

    void loadProductDetails();

    return () => {
      active = false;
    };
  }, [listProduct, loading, params.id]);

  const handleSubmit = async ({ product: nextProduct, meta }: AdminProductFormSubmit) => {
    if (!product) {
      return;
    }

    const updated = await updateProduct(product.id, nextProduct);
    await saveWorkspace(() => ({
      productMeta: {
        [product.id]: {
          ...meta,
          productId: product.id,
          status: updated.status || meta.status,
          fitType: updated.fitType || meta.fitType,
          gender: updated.gender || meta.gender,
          collectionLabels: updated.collectionLabels || meta.collectionLabels,
          galleryImages: updated.galleryImages || meta.galleryImages,
        },
      },
    }));
    router.push("/admin/products");
  };

  return (
    <AdminShell>
      {loading || detailLoading ? (
        <AdminPanel>
          <p className="text-sm text-[var(--muted)]">Loading product...</p>
        </AdminPanel>
      ) : product ? (
        <AdminProductForm
          initialProduct={product}
          initialMeta={resolveProductAdminMeta(workspace, product)}
          categoryOptions={categoryOptions}
          submitLabel="Update product"
          title="Edit launch product."
          description="Update catalog copy, premium imagery, manual visibility status, and merchandising labels from one luxury admin surface."
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
