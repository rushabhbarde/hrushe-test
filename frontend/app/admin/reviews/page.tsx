"use client";

import { AdminModulePage } from "@/components/admin-module-page";

export default function AdminReviewsPage() {
  return (
    <AdminModulePage
      eyebrow="Marketing"
      title="Reviews and product feedback."
      description="Moderate product reviews, feature the best proof points, and keep customer sentiment useful for conversion."
      stats={[
        { label: "Moderation", value: "Live", detail: "Product reviews already exist on the catalog model." },
        { label: "Featured reviews", value: "Ready", detail: "Trusted social proof can flow to storefront sections." },
        { label: "Ratings filter", value: "Planned", detail: "Prepared for moderation workflows next." },
        { label: "Customer photo proof", value: "Supported", detail: "Review photo fields already exist in the product model." },
      ]}
      sections={[
        {
          title: "Moderation flow",
          items: [
            { title: "Approve / reject", description: "A review control surface is ready to connect to moderation actions." },
            { title: "Featured testimonials", description: "Strong reviews can be elevated into storefront trust sections." },
          ],
        },
        {
          title: "Product-linked insight",
          items: [
            { title: "Per-product view", description: "Feedback stays tied to the exact product, fit, and customer story." },
            { title: "Quality notes", description: "Moderation notes and product team feedback can live here later." },
          ],
        },
      ]}
    />
  );
}
