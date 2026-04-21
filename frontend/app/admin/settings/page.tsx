"use client";

import { AdminModulePage } from "@/components/admin-module-page";

export default function AdminSettingsPage() {
  return (
    <AdminModulePage
      eyebrow="Settings"
      title="Store, team, and integration settings."
      description="A structured system area for brand settings, notification defaults, roles, payments, and future integrations."
      stats={[
        { label: "General store", value: "Ready", detail: "Brand and storefront defaults can live here." },
        { label: "Notifications", value: "Ready", detail: "Email and customer communication settings fit naturally here." },
        { label: "Roles", value: "Placeholder", detail: "Admin users and permissions can be added next." },
        { label: "Integrations", value: "Connected", detail: "Mail, payment, and webhook setup belong in this layer." },
      ]}
      sections={[
        {
          title: "Store settings",
          items: [
            { title: "General store info", description: "Brand identity, contacts, and policy defaults." },
            { title: "Shipping and tax", description: "Prepared for future operational rules and tax logic." },
            { title: "Payment settings", description: "Razorpay and checkout infrastructure fit here." },
          ],
        },
        {
          title: "Team and systems",
          items: [
            { title: "Admin roles", description: "Permissions and teammate access can be layered in when needed." },
            { title: "Templates and notifications", description: "Email/SMS template management belongs here." },
          ],
        },
      ]}
    />
  );
}
