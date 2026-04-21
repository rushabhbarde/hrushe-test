"use client";

import { AdminModulePage } from "@/components/admin-module-page";

export default function AdminCollectionsPage() {
  return (
    <AdminModulePage
      eyebrow="Catalog"
      title="Collections built for storytelling."
      description="Seasonal edits, featured drops, and merchandising capsules that help the storefront feel editorial rather than purely transactional."
      primaryAction={{ label: "Edit homepage", href: "/admin/storefront" }}
      stats={[
        { label: "Collections", value: "Ready", detail: "Structured for seasonal and featured groupings." },
        { label: "Featured edits", value: "Supported", detail: "Collections can map naturally into homepage modules." },
        { label: "Seasonal drops", value: "Supported", detail: "Perfect for launches and campaign groupings." },
        { label: "Sort order", value: "Future-ready", detail: "Designed for control without clutter." },
      ]}
      sections={[
        {
          title: "Collection management",
          items: [
            { title: "Create and edit collections", description: "Curate product groups with title, description, and banner context." },
            { title: "Product association", description: "Tie collections directly to merchandising and campaign storytelling." },
          ],
        },
        {
          title: "Storefront use",
          items: [
            { title: "Homepage integration", description: "Collections are ready to feed featured rows and landing pages." },
            { title: "Seasonal sequencing", description: "Use active states and ordering to keep launches tidy." },
          ],
        },
      ]}
    />
  );
}
