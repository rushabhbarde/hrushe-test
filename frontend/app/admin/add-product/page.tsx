"use client";

import { useRouter } from "next/navigation";
import {
  AdminProductForm,
  type AdminProductFormSubmit,
} from "@/components/admin-product-form";
import { AdminShell } from "@/components/admin-shell";
import { useStorefrontData } from "@/lib/use-storefront";
import { resolveCatalogCategories } from "@/lib/admin-workspace";
import { useAdminWorkspace } from "@/lib/use-admin-workspace";

export default function AddProductPage() {
  const { addProduct } = useStorefrontData({ admin: true });
  const { workspace, saveWorkspace } = useAdminWorkspace();
  const router = useRouter();
  const categoryOptions = resolveCatalogCategories(workspace);

  const handleSubmit = async ({ product, meta }: AdminProductFormSubmit) => {
    const created = await addProduct(product);
    await saveWorkspace(() => ({
      productMeta: {
        [created.id]: {
          ...meta,
          productId: created.id,
          status: created.status || meta.status,
          fitType: created.fitType || meta.fitType,
          gender: created.gender || meta.gender,
          collectionLabels: created.collectionLabels || meta.collectionLabels,
          galleryImages: created.galleryImages || meta.galleryImages,
        },
      },
    }));
    router.push("/admin/products");
  };

  return (
    <AdminShell>
      <AdminProductForm
        categoryOptions={categoryOptions}
        submitLabel="Save piece"
        title="A new piece."
        description="Name it, price it, give it photos for each side, and set the sizes you have."
        onSubmit={handleSubmit}
      />
    </AdminShell>
  );
}
