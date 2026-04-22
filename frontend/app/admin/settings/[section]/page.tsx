"use client";

import { useParams } from "next/navigation";
import { AdminModulePage } from "@/components/admin-module-page";

const settingsConfig = {
  store: {
    title: "Store settings.",
    description: "Brand identity, public contact details, currency, shipping defaults, policy links, and storefront metadata.",
  },
  general: {
    title: "General store settings.",
    description: "Brand identity, public contact details, currency, taxes, shipping defaults, and store metadata.",
  },
  notifications: {
    title: "Notification settings.",
    description: "Email, order updates, template defaults, and customer communication preferences.",
  },
  roles: {
    title: "Roles and permissions.",
    description: "Admin users, team access, permission groups, and operational accountability controls.",
  },
  "admin-users": {
    title: "Admin users.",
    description: "Team access, operational roles, password resets, and permission groups for staff accounts.",
  },
  integrations: {
    title: "Integrations.",
    description: "Razorpay, ZeptoMail, webhooks, analytics, shipping partners, and future automation surfaces.",
  },
} as const;

export default function AdminSettingsSectionPage() {
  const params = useParams<{ section: keyof typeof settingsConfig }>();
  const config = settingsConfig[params.section] || settingsConfig.store;

  return (
    <AdminModulePage
      eyebrow="Settings"
      title={config.title}
      description={config.description}
      stats={[
        { label: "Status", value: "Structured", detail: "The page exists and is ready for deeper controls." },
        { label: "Security", value: "Admin only", detail: "Protected by the same admin guard and API token flow." },
        { label: "Scalable", value: "Ready", detail: "Future fields can be added without reshaping navigation." },
        { label: "Audit", value: "Future", detail: "Change history can plug in later." },
      ]}
      sections={[
        {
          title: "Configuration areas",
          items: [
            { title: "Editable settings", description: "Store defaults and operational rules will sit in guided form sections." },
            { title: "Validation", description: "Future inputs should keep safe defaults and clear error states." },
          ],
        },
        {
          title: "Operational notes",
          items: [
            { title: "Permissions", description: "Sensitive settings belong behind role-based controls once team access expands." },
            { title: "Integrations", description: "External services should be visible here but secrets stay in Render/Vercel env vars." },
          ],
        },
      ]}
    />
  );
}
