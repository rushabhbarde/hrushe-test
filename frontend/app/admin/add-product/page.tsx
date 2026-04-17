"use client";

import { AdminGuard } from "@/components/admin-guard";
import { AdminProductForm } from "@/components/admin-product-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { Product } from "@/lib/catalog";
import { useStorefrontData } from "@/lib/use-storefront";

export default function AddProductPage() {
  const { addProduct } = useStorefrontData();
  const handleSubmit = async (product: Product) => {
    await addProduct(product);
  };

  return (
    <div className="page-shell">
      <SiteHeader />
      <AdminGuard>
        <main className="mx-auto w-full max-w-[1600px] px-5 py-10 sm:px-8 lg:px-10">
          <AdminProductForm
            submitLabel="Save product"
            title="Create the next product drop."
            description="Upload multiple product images, choose available sizes, pick a storefront category, and decide whether the item should appear in featured, best-seller, new-in, or new-arrival sections."
            onSubmit={handleSubmit}
          />
        </main>
      </AdminGuard>
      <SiteFooter />
    </div>
  );
}
