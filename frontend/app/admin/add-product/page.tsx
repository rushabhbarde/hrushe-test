"use client";

import { useRouter } from "next/navigation";
import {
  AdminProductForm,
  type AdminProductFormSubmit,
} from "@/components/admin-product-form";
import { AdminShell } from "@/components/admin-shell";
import { useStorefrontData } from "@/lib/use-storefront";
import { useAdminWorkspace } from "@/lib/use-admin-workspace";

export default function AddProductPage() {
  const { addProduct } = useStorefrontData();
  const { workspace, saveWorkspace } = useAdminWorkspace();
  const router = useRouter();

  const handleSubmit = async ({ product, meta }: AdminProductFormSubmit) => {
    const created = await addProduct(product);
    await saveWorkspace({
      productMeta: {
        ...workspace.productMeta,
        [created.id]: {
          ...meta,
          productId: created.id,
        },
      },
    });
    router.push("/admin/products");
  };

  return (
    <AdminShell>
      <AdminProductForm
        submitLabel="Save product"
        title="Create the next product drop."
        description="Create premium product entries with manual status control, rich imagery, fit settings, and collection labels without touching inventory."
        onSubmit={handleSubmit}
      />
    </AdminShell>
  );
}
