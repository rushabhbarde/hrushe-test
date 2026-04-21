"use client";

import { AdminProductForm } from "@/components/admin-product-form";
import { AdminShell } from "@/components/admin-shell";
import { type Product } from "@/lib/catalog";
import { useStorefrontData } from "@/lib/use-storefront";

export default function AddProductPage() {
  const { addProduct } = useStorefrontData();

  const handleSubmit = async (product: Product) => {
    await addProduct(product);
  };

  return (
    <AdminShell>
      <AdminProductForm
        submitLabel="Save product"
        title="Create the next product drop."
        description="Upload multiple product images, choose available sizes, shape category visibility, and decide whether the item should sit in featured, best-seller, new-in, or new-arrival merchandising."
        onSubmit={handleSubmit}
      />
    </AdminShell>
  );
}
