"use client";

import { AdminModulePage } from "@/components/admin-module-page";

export default function AdminInventoryPage() {
  return (
    <AdminModulePage
      eyebrow="Catalog"
      title="Inventory prepared for scale."
      description="Variant-wise stock, low-stock visibility, and warehouse-ready structure so inventory can grow with the brand."
      primaryAction={{ label: "Update stock", href: "/admin/products" }}
      stats={[
        { label: "Tracked variants", value: "Live", detail: "Variant stock is inferred from active size setup today." },
        { label: "Low stock alerts", value: "Placeholder", detail: "Ready for future stock thresholds." },
        { label: "Out of stock", value: "0", detail: "Structured for variant-level visibility." },
        { label: "Warehouse", value: "Future-ready", detail: "Location support can drop in naturally later." },
      ]}
      sections={[
        {
          title: "Stock operations",
          description: "Workflows designed to grow from a lean launch to real inventory handling.",
          items: [
            { title: "Variant stock list", description: "A future-ready stock surface for size, color, and fit combinations.", meta: "Catalog ops" },
            { title: "Incoming stock", description: "Placeholder hooks for purchase orders, restocks, and inbound batches.", meta: "Future" },
            { title: "Stock history", description: "Space reserved for adjustments, reasons, and team accountability logs.", meta: "Audit trail" },
          ],
        },
        {
          title: "Readiness",
          items: [
            { title: "Low stock alerting", description: "Prepared for thresholds once true stock counts are introduced." },
            { title: "Location awareness", description: "Warehouse or city-level stock distribution can plug into this module later." },
          ],
        },
      ]}
    />
  );
}
