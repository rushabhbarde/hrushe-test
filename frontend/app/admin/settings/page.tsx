"use client";

import { useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import {
  AdminField,
  AdminFilterInput,
  AdminPageHeader,
  AdminPanel,
  AdminSubhead,
  AdminSwitch,
  AdminTextArea,
} from "@/components/admin-ui";
import { useToast } from "@/components/toast-provider";
import { type WebsiteSettings } from "@/lib/admin-workspace";
import { useAdminWorkspace } from "@/lib/use-admin-workspace";

export default function AdminSettingsPage() {
  const { workspace, saveWorkspace } = useAdminWorkspace();
  const { pushToast } = useToast();
  const [draft, setDraft] = useState<WebsiteSettings | null>(null);
  const activeDraft = draft || workspace.websiteSettings;

  async function saveSettings() {
    await saveWorkspace({ websiteSettings: activeDraft });
    setDraft(null);
    pushToast("Website settings saved.");
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Website settings"
          title="Manage brand identity, SEO, analytics, and storefront safeguards."
          description="Update the public-facing brand layer and operational website integrations from one responsive settings surface."
        />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)]">
          <AdminPanel>
            <AdminSubhead title="Brand and contact details" />
            <div className="grid gap-4 md:grid-cols-2">
              <AdminField label="Brand name">
                <AdminFilterInput value={activeDraft.brandName} onChange={(event) => setDraft((current) => ({ ...(current || activeDraft), brandName: event.target.value }))} />
              </AdminField>
              <AdminField label="Logo URL">
                <AdminFilterInput value={activeDraft.logoUrl} onChange={(event) => setDraft((current) => ({ ...(current || activeDraft), logoUrl: event.target.value }))} />
              </AdminField>
              <AdminField label="Favicon URL">
                <AdminFilterInput value={activeDraft.faviconUrl} onChange={(event) => setDraft((current) => ({ ...(current || activeDraft), faviconUrl: event.target.value }))} />
              </AdminField>
              <AdminField label="Contact email">
                <AdminFilterInput value={activeDraft.contactEmail} onChange={(event) => setDraft((current) => ({ ...(current || activeDraft), contactEmail: event.target.value }))} />
              </AdminField>
              <AdminField label="Contact phone">
                <AdminFilterInput value={activeDraft.contactPhone} onChange={(event) => setDraft((current) => ({ ...(current || activeDraft), contactPhone: event.target.value }))} />
              </AdminField>
              <AdminField label="Support WhatsApp">
                <AdminFilterInput value={activeDraft.supportWhatsapp} onChange={(event) => setDraft((current) => ({ ...(current || activeDraft), supportWhatsapp: event.target.value }))} />
              </AdminField>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <AdminField label="Instagram URL">
                <AdminFilterInput value={activeDraft.instagramUrl} onChange={(event) => setDraft((current) => ({ ...(current || activeDraft), instagramUrl: event.target.value }))} />
              </AdminField>
              <AdminField label="Facebook URL">
                <AdminFilterInput value={activeDraft.facebookUrl} onChange={(event) => setDraft((current) => ({ ...(current || activeDraft), facebookUrl: event.target.value }))} />
              </AdminField>
              <AdminField label="Pinterest URL">
                <AdminFilterInput value={activeDraft.pinterestUrl} onChange={(event) => setDraft((current) => ({ ...(current || activeDraft), pinterestUrl: event.target.value }))} />
              </AdminField>
            </div>
          </AdminPanel>

          <AdminPanel>
            <AdminSubhead title="SEO and integrations" />
            <div className="grid gap-4">
              <AdminField label="SEO title">
                <AdminFilterInput value={activeDraft.seoTitle} onChange={(event) => setDraft((current) => ({ ...(current || activeDraft), seoTitle: event.target.value }))} />
              </AdminField>
              <AdminField label="SEO description">
                <AdminTextArea value={activeDraft.seoDescription} onChange={(event) => setDraft((current) => ({ ...(current || activeDraft), seoDescription: event.target.value }))} />
              </AdminField>
              <AdminField label="Google Analytics ID">
                <AdminFilterInput value={activeDraft.analyticsId} onChange={(event) => setDraft((current) => ({ ...(current || activeDraft), analyticsId: event.target.value }))} />
              </AdminField>
              <AdminField label="Meta Pixel ID">
                <AdminFilterInput value={activeDraft.metaPixelId} onChange={(event) => setDraft((current) => ({ ...(current || activeDraft), metaPixelId: event.target.value }))} />
              </AdminField>
              <AdminSwitch
                checked={activeDraft.maintenanceMode}
                onChange={(checked) => setDraft((current) => ({ ...(current || activeDraft), maintenanceMode: checked }))}
                label="Maintenance mode"
                description="Hide the storefront behind maintenance messaging while the admin remains accessible."
              />
              <button type="button" onClick={() => void saveSettings()} className="button-primary px-5 py-3 text-sm font-medium">
                Save settings
              </button>
            </div>
          </AdminPanel>
        </div>
      </div>
    </AdminShell>
  );
}
