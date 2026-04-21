"use client";

import { AdminModulePage } from "@/components/admin-module-page";

export default function AdminCategoriesPage() {
  return (
    <AdminModulePage
      eyebrow="Catalog"
      title="Categories and taxonomy."
      description="Keep catalog structure clean with categories, subcategories, product association, and future merchandising order."
      primaryAction={{ label: "Manage products", href: "/admin/products" }}
      stats={[
        { label: "Categories", value: "Live", detail: "Category data is already flowing through products." },
        { label: "Subcategories", value: "Placeholder", detail: "Prepared for deeper taxonomy next." },
        { label: "Featured sets", value: "Ready", detail: "Use categories with collections for merchandising." },
        { label: "Sort order", value: "Ready", detail: "Future ordering rules can live here." },
      ]}
      sections={[
        {
          title: "Taxonomy control",
          items: [
            { title: "Categories", description: "Core catalog organization for storefront filters and navigation." },
            { title: "Subcategories", description: "Ready for finer product grouping when the assortment grows." },
          ],
        },
        {
          title: "Brand storytelling",
          items: [
            { title: "Banner association", description: "Attach imagery and descriptions to key category destinations." },
            { title: "Active / inactive states", description: "Prepared for seasonal hiding and merchandising cleanup." },
          ],
        },
      ]}
    />
  );
}
