"use client";

import { useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import {
  AdminField,
  AdminFilterInput,
  AdminPageHeader,
  AdminPanel,
  AdminSubhead,
  AdminTextArea,
} from "@/components/admin-ui";
import { useToast } from "@/components/toast-provider";
import { contentPageKeys, type ContentPageKey } from "@/lib/admin-workspace";
import { useAdminWorkspace } from "@/lib/use-admin-workspace";

const pageLabels: Record<ContentPageKey, string> = {
  aboutUs: "About Us",
  contactUs: "Contact Us",
  faq: "FAQ",
  privacyPolicy: "Privacy Policy",
  returnPolicy: "Return Policy",
  shippingPolicy: "Shipping Policy",
  termsAndConditions: "Terms & Conditions",
  sizeGuide: "Size Guide",
};

export default function AdminContentPage() {
  const { workspace, saveWorkspace } = useAdminWorkspace();
  const { pushToast } = useToast();
  const [selectedPage, setSelectedPage] = useState<ContentPageKey>("aboutUs");
  const [draftPages, setDraftPages] = useState<typeof workspace.contentPages | null>(null);
  const activePages = draftPages || workspace.contentPages;
  const page = activePages[selectedPage];

  return (
    <AdminShell>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Content management"
          title="Maintain every policy and brand page from one CMS layer."
          description="Edit about, support, policy, FAQ, and size-guide content while keeping SEO metadata close to the copy."
        />

        <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
          <AdminPanel>
            <AdminSubhead title="Pages" />
            <div className="space-y-2">
              {contentPageKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedPage(key)}
                  className={`w-full px-3 py-3 text-left text-sm ${
                    selectedPage === key
                      ? "bg-[var(--foreground)] text-[var(--background)]"
                      : "border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)]"
                  }`}
                >
                  {pageLabels[key]}
                </button>
              ))}
            </div>
          </AdminPanel>

          <AdminPanel>
            <AdminSubhead title={pageLabels[selectedPage]} description={`Last updated ${new Date(page.updatedAt).toLocaleString("en-IN")}`} />
            <div className="grid gap-4">
              <AdminField label="Title">
                <AdminFilterInput
                  value={page.title}
                  onChange={(event) =>
                    setDraftPages((current) => ({
                      ...(current || activePages),
                      [selectedPage]: {
                        ...page,
                        title: event.target.value,
                        updatedAt: new Date().toISOString(),
                      },
                    }))
                  }
                />
              </AdminField>
              <AdminField label="Excerpt">
                <AdminFilterInput
                  value={page.excerpt}
                  onChange={(event) =>
                    setDraftPages((current) => ({
                      ...(current || activePages),
                      [selectedPage]: {
                        ...page,
                        excerpt: event.target.value,
                        updatedAt: new Date().toISOString(),
                      },
                    }))
                  }
                />
              </AdminField>
              <AdminField label="Body copy">
                <AdminTextArea
                  value={page.body}
                  onChange={(event) =>
                    setDraftPages((current) => ({
                      ...(current || activePages),
                      [selectedPage]: {
                        ...page,
                        body: event.target.value,
                        updatedAt: new Date().toISOString(),
                      },
                    }))
                  }
                />
              </AdminField>
              <div className="grid gap-4 md:grid-cols-2">
                <AdminField label="SEO title">
                  <AdminFilterInput
                    value={page.seoTitle}
                    onChange={(event) =>
                      setDraftPages((current) => ({
                        ...(current || activePages),
                        [selectedPage]: {
                          ...page,
                          seoTitle: event.target.value,
                          updatedAt: new Date().toISOString(),
                        },
                      }))
                    }
                  />
                </AdminField>
                <AdminField label="SEO description">
                  <AdminTextArea
                    value={page.seoDescription}
                    onChange={(event) =>
                      setDraftPages((current) => ({
                        ...(current || activePages),
                        [selectedPage]: {
                          ...page,
                          seoDescription: event.target.value,
                          updatedAt: new Date().toISOString(),
                        },
                      }))
                    }
                  />
                </AdminField>
              </div>
              <button
                type="button"
                onClick={() =>
                  void saveWorkspace({ contentPages: activePages }).then(() => {
                    setDraftPages(null);
                    pushToast("Content page saved.");
                  })
                }
                className="button-primary px-5 py-3 text-sm font-medium"
              >
                Save page
              </button>
            </div>
          </AdminPanel>
        </div>
      </div>
    </AdminShell>
  );
}
