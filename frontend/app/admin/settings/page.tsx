"use client";

import { useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import {
  AdminField,
  AdminFilterInput,
  AdminPageHeader,
  AdminPanel,
  AdminSubhead,
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
    try {
      await saveWorkspace({ websiteSettings: activeDraft });
      setDraft(null);
      pushToast("Website settings saved.");
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Could not save website settings.", "error");
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Website settings"
          title="Manage public contact and support details."
          description="These values publish to the storefront footer and customer support links. Deployment secrets remain outside the dashboard."
        />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)]">
          <AdminPanel>
            <AdminSubhead title="Brand and contact details" />
            <div className="grid gap-4 md:grid-cols-2">
              <AdminField label="Brand name">
                <AdminFilterInput value={activeDraft.brandName} onChange={(event) => setDraft((current) => ({ ...(current || activeDraft), brandName: event.target.value }))} />
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
            <AdminSubhead title="Publish" description="Changes appear in the storefront footer after cache revalidation." />
            <div className="grid gap-4">
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
