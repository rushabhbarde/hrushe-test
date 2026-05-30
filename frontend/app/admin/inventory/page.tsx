"use client";

import { AdminModulePage } from "@/components/admin-module-page";

export default function AdminInventoryPage() {
  return (
    <AdminModulePage
      eyebrow="Catalog"
      title="Inventory is intentionally excluded."
      description="The HRUSHE admin uses manual product visibility states only. Products stay controlled through Active, Draft, Hidden, and Sold Out without stock counting."
      primaryAction={{ label: "Open product management", href: "/admin/products" }}
      stats={[
        { label: "Product IDs", value: "Auto-generated", detail: "Every product uses a database ID instead of stock SKUs." },
        { label: "Visibility control", value: "Live", detail: "Status is managed manually from the product form and list." },
        { label: "Sold out", value: "Manual", detail: "Admins can mark products as Sold Out without inventory tracking." },
        { label: "Warehousing", value: "Disabled", detail: "No warehouse or stock-count workflows are included by design." },
      ]}
      sections={[
        {
          title: "Current model",
          description: "The admin follows the requested manual-merchandising approach.",
          items: [
            { title: "Manual statuses", description: "Use Active, Draft, Hidden, or Sold Out to control storefront visibility.", meta: "Catalog ops" },
            { title: "No stock counts", description: "There are no quantity fields, thresholds, or restock ledgers in this admin.", meta: "By design" },
          ],
        },
        {
          title: "Where to manage products",
          items: [
            { title: "Product management", description: "Use the catalog screens for imagery, pricing, fit, gender, labels, and visibility." },
            { title: "Homepage merchandising", description: "Use Home Management to decide what gets promoted rather than stock-based automation." },
          ],
        },
      ]}
    />
  );
}
