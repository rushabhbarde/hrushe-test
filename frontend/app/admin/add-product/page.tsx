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
        submitLabel="Save product"
        title="Create the next product drop."
        description="Create premium product entries with manual status control, rich imagery, fit settings, and collection labels without touching inventory."
        onSubmit={handleSubmit}
      />
    </AdminShell>
  );
}
