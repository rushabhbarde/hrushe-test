"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import {
  AdminBadge,
  AdminConfirmDialog,
  AdminField,
  AdminFilterInput,
  AdminPageHeader,
  AdminPanel,
  AdminSectionLabel,
  AdminSubhead,
  AdminSwitch,
  AdminTextArea,
} from "@/components/admin-ui";
import { useToast } from "@/components/toast-provider";
import { compressSingleImage } from "@/lib/image-upload";
import { type AdminBanner } from "@/lib/admin-workspace";
import { useAdminWorkspace } from "@/lib/use-admin-workspace";

function createBanner(): AdminBanner {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `banner-${Date.now()}`;

  return {
    id,
    label: "Campaign banner",
    title: "New campaign headline",
    subtitle: "Add luxury-led copy for the homepage hero and campaign handoff.",
    ctaText: "Shop now",
    ctaLink: "/shop",
    desktopImage: "/uploads/banners/banner1.png",
    mobileImage: "/uploads/banners/banner1.png",
    enabled: true,
    scheduleStart: null,
    scheduleEnd: null,
  };
}

export default function AdminHomepagePage() {
  const { workspace, saveWorkspace } = useAdminWorkspace();
  const { pushToast } = useToast();
  const [draftBanners, setDraftBanners] = useState<AdminBanner[] | null>(null);
  const [selectedBannerId, setSelectedBannerId] = useState("");
  const [draggedBannerId, setDraggedBannerId] = useState("");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [publishOpen, setPublishOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const banners = draftBanners || workspace.homeManagement.banners;

  const selectedBanner = useMemo(
    () => banners.find((banner) => banner.id === selectedBannerId) || banners[0] || null,
    [banners, selectedBannerId]
  );

  function updateDraftBanners(updater: (current: AdminBanner[]) => AdminBanner[]) {
    setDraftBanners((current) => updater(current || workspace.homeManagement.banners));
  }

  function updateSelectedBanner(patch: Partial<AdminBanner>) {
    if (!selectedBanner) {
      return;
    }

    updateDraftBanners((current) =>
      current.map((banner) =>
        banner.id === selectedBanner.id ? { ...banner, ...patch } : banner
      )
    );
  }

  async function handleImageUpload(
    event: React.ChangeEvent<HTMLInputElement>,
    field: "desktopImage" | "mobileImage"
  ) {
    const file = event.target.files?.[0];

    if (!file || !selectedBanner) {
      return;
    }

    try {
      const compressed = await compressSingleImage(file, field === "desktopImage" ? 1440 : 960);
      updateSelectedBanner({ [field]: compressed });
      pushToast(`${field === "desktopImage" ? "Desktop" : "Mobile"} banner uploaded.`);
    } catch {
      pushToast("Could not process that banner image.", "error");
    }
  }

  async function publishChanges() {
    await saveWorkspace({
      homeManagement: {
        banners,
        lastPublishedAt: new Date().toISOString(),
      },
    });
    setDraftBanners(null);
    pushToast("Homepage banners published.");
    setPublishOpen(false);
  }

  function moveBanner(targetId: string) {
    if (!draggedBannerId || draggedBannerId === targetId) {
      return;
    }

    updateDraftBanners((current) => {
      const fromIndex = current.findIndex((banner) => banner.id === draggedBannerId);
      const toIndex = current.findIndex((banner) => banner.id === targetId);

      if (fromIndex < 0 || toIndex < 0) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  function deleteSelectedBanner() {
    if (!selectedBanner) {
      return;
    }

    const remaining = banners.filter((banner) => banner.id !== selectedBanner.id);
    setDraftBanners(remaining);
    setSelectedBannerId(remaining[0]?.id || "");
    setDeleteOpen(false);
    pushToast("Banner removed from the draft.");
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Home management"
          title="Compose luxury homepage campaigns before you publish."
          description="Upload separate desktop and mobile visuals, reorder banners with drag-and-drop, schedule launches, and preview the live hero before publishing."
          actions={
            <>
              <button
                type="button"
                onClick={() => {
                  const banner = createBanner();
                  updateDraftBanners((current) => [...current, banner]);
                  setSelectedBannerId(banner.id);
                }}
                className="button-secondary px-5 py-3 text-sm font-medium"
              >
                Add banner
              </button>
              <button
                type="button"
                onClick={() => setPublishOpen(true)}
                className="button-primary px-5 py-3 text-sm font-medium"
              >
                Publish homepage
              </button>
            </>
          }
        />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <AdminPanel>
            <AdminSubhead
              title="Banner stack"
              description="Drag banners to set the hero rotation order. The first active banner becomes the primary homepage story."
            />
            <div className="space-y-3">
              {banners.map((banner) => (
                <button
                  key={banner.id}
                  type="button"
                  draggable
                  onDragStart={() => setDraggedBannerId(banner.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => moveBanner(banner.id)}
                  onClick={() => setSelectedBannerId(banner.id)}
                  className={`flex w-full items-center gap-4 border px-4 py-4 text-left transition ${
                    selectedBanner?.id === banner.id
                      ? "border-[var(--foreground)] bg-[color:color-mix(in_srgb,var(--foreground)_5%,transparent)]"
                      : "border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--foreground)_3%,transparent)]"
                  }`}
                >
                  <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">Drag</span>
                  <div className="relative h-18 w-18 shrink-0 overflow-hidden border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface-strong)_82%,transparent)]">
                    {banner.desktopImage ? (
                      <Image src={banner.desktopImage} alt={banner.title} fill unoptimized className="object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold">{banner.title}</p>
                      <AdminBadge tone={banner.enabled ? "success" : "warning"}>
                        {banner.enabled ? "Enabled" : "Disabled"}
                      </AdminBadge>
                    </div>
                    <p className="mt-1 truncate text-xs text-[var(--muted)]">{banner.subtitle}</p>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
                      {banner.scheduleStart
                        ? `Starts ${new Date(banner.scheduleStart).toLocaleDateString("en-IN")}`
                        : "No schedule"}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-5 border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] px-4 py-4">
              <AdminSectionLabel>Publish status</AdminSectionLabel>
              <p className="mt-3 text-sm text-[var(--muted)]">
                Last published{" "}
                {workspace.homeManagement.lastPublishedAt
                  ? new Date(workspace.homeManagement.lastPublishedAt).toLocaleString("en-IN")
                  : "never"}.
              </p>
            </div>
          </AdminPanel>

          <AdminPanel>
            <AdminSubhead
              title="Banner editor"
              description="Craft title, subtitle, CTA, device-specific imagery, and campaign timing."
              action={
                selectedBanner ? (
                  <button
                    type="button"
                    onClick={() => setDeleteOpen(true)}
                    className="px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-[var(--danger)]"
                  >
                    Delete banner
                  </button>
                ) : null
              }
            />

            {selectedBanner ? (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <AdminField label="Banner label" hint="Internal campaign naming for the admin team.">
                    <AdminFilterInput
                      value={selectedBanner.label}
                      onChange={(event) => updateSelectedBanner({ label: event.target.value })}
                    />
                  </AdminField>
                  <AdminField label="CTA link" hint="Storefront URL or collection path.">
                    <AdminFilterInput
                      value={selectedBanner.ctaLink}
                      onChange={(event) => updateSelectedBanner({ ctaLink: event.target.value })}
                    />
                  </AdminField>
                </div>

                <AdminField label="Banner title">
                  <AdminFilterInput
                    value={selectedBanner.title}
                    onChange={(event) => updateSelectedBanner({ title: event.target.value })}
                  />
                </AdminField>

                <AdminField label="Banner subtitle">
                  <AdminTextArea
                    value={selectedBanner.subtitle}
                    onChange={(event) => updateSelectedBanner({ subtitle: event.target.value })}
                  />
                </AdminField>

                <div className="grid gap-4 md:grid-cols-2">
                  <AdminField label="CTA text">
                    <AdminFilterInput
                      value={selectedBanner.ctaText}
                      onChange={(event) => updateSelectedBanner({ ctaText: event.target.value })}
                    />
                  </AdminField>
                  <AdminField label="Schedule start">
                    <AdminFilterInput
                      type="datetime-local"
                      value={selectedBanner.scheduleStart?.slice(0, 16) || ""}
                      onChange={(event) =>
                        updateSelectedBanner({
                          scheduleStart: event.target.value
                            ? new Date(event.target.value).toISOString()
                            : null,
                        })
                      }
                    />
                  </AdminField>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <AdminField label="Schedule end">
                    <AdminFilterInput
                      type="datetime-local"
                      value={selectedBanner.scheduleEnd?.slice(0, 16) || ""}
                      onChange={(event) =>
                        updateSelectedBanner({
                          scheduleEnd: event.target.value
                            ? new Date(event.target.value).toISOString()
                            : null,
                        })
                      }
                    />
                  </AdminField>
                  <AdminSwitch
                    checked={selectedBanner.enabled}
                    onChange={(checked) => updateSelectedBanner({ enabled: checked })}
                    label="Enable banner"
                    description="Disabled banners stay in the stack but never reach the storefront."
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <AdminField label="Desktop banner image" hint="Upload the widescreen version shown on larger breakpoints.">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => void handleImageUpload(event, "desktopImage")}
                      className="block w-full text-sm text-[var(--muted)] file:mr-4 file:border-0 file:bg-[var(--foreground)] file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-[var(--background)]"
                    />
                  </AdminField>
                  <AdminField label="Mobile banner image" hint="Upload the portrait crop used on smaller screens.">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => void handleImageUpload(event, "mobileImage")}
                      className="block w-full text-sm text-[var(--muted)] file:mr-4 file:border-0 file:bg-[var(--foreground)] file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-[var(--background)]"
                    />
                  </AdminField>
                </div>

                <div className="grid gap-5 lg:grid-cols-[150px_minmax(0,1fr)]">
                  <div className="flex flex-wrap gap-2 lg:flex-col">
                    <button
                      type="button"
                      onClick={() => setPreviewMode("desktop")}
                      className={`px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] ${
                        previewMode === "desktop"
                          ? "bg-[var(--foreground)] text-[var(--background)]"
                          : "border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_84%,transparent)] text-[var(--muted)]"
                      }`}
                    >
                      Desktop
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode("mobile")}
                      className={`px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] ${
                        previewMode === "mobile"
                          ? "bg-[var(--foreground)] text-[var(--background)]"
                          : "border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_84%,transparent)] text-[var(--muted)]"
                      }`}
                    >
                      Mobile
                    </button>
                  </div>

                  <div className="overflow-hidden border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_82%,transparent)]">
                    <div
                      className={`relative ${
                        previewMode === "desktop" ? "aspect-[16/9]" : "mx-auto aspect-[9/16] max-w-[280px]"
                      }`}
                    >
                      <Image
                        src={
                          previewMode === "desktop"
                            ? selectedBanner.desktopImage
                            : selectedBanner.mobileImage
                        }
                        alt={selectedBanner.title}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.15),rgba(0,0,0,0.5))]" />
                      <div className="absolute bottom-0 left-0 max-w-[80%] p-6 text-white">
                        <p className="text-[11px] uppercase tracking-[0.24em]">
                          {selectedBanner.label || "Campaign"}
                        </p>
                        <h2 className="display-font mt-3 text-3xl leading-none sm:text-4xl">
                          {selectedBanner.title}
                        </h2>
                        <p className="mt-4 text-sm leading-6 text-white/82">
                          {selectedBanner.subtitle}
                        </p>
                        <span className="mt-5 inline-flex border border-white/30 bg-white/12 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] backdrop-blur">
                          {selectedBanner.ctaText}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">Select a banner to edit.</p>
            )}
          </AdminPanel>
        </div>

        <AdminConfirmDialog
          open={publishOpen}
          title="Publish homepage campaign changes?"
          description="This will push the current banner stack, ordering, and schedules to the live storefront configuration."
          confirmLabel="Publish now"
          onConfirm={() => void publishChanges()}
          onCancel={() => setPublishOpen(false)}
        />

        <AdminConfirmDialog
          open={deleteOpen}
          title="Delete this banner draft?"
          description="This removes the selected banner from the homepage stack. You can publish later once the new order is ready."
          confirmLabel="Delete banner"
          destructive
          onConfirm={deleteSelectedBanner}
          onCancel={() => setDeleteOpen(false)}
        />
      </div>
    </AdminShell>
  );
}
