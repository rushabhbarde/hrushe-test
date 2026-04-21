"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { AdminBadge, AdminPageHeader, AdminPanel, AdminSectionLabel } from "@/components/admin-ui";
import { defaultHomepageBanner } from "@/lib/storefront-data";
import { useStorefrontData } from "@/lib/use-storefront";

export default function AdminHomepagePage() {
  const { homepageBanner, saveHomepageBanner } = useStorefrontData();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState(homepageBanner);

  useEffect(() => {
    setForm(homepageBanner);
  }, [homepageBanner]);

  const onChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Storefront"
          title="Homepage banner and announcement control."
          description="Adjust campaign copy, promo strip, and CTA paths from one clean content surface."
          actions={<AdminBadge tone="accent">Live banner</AdminBadge>}
        />

        <AdminPanel>
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <button
                type="button"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    announcementText: defaultHomepageBanner.announcementText,
                    eyebrow: defaultHomepageBanner.eyebrow,
                    title: defaultHomepageBanner.title,
                    description: defaultHomepageBanner.description,
                    primaryCtaLabel: defaultHomepageBanner.primaryCtaLabel,
                    primaryCtaHref: defaultHomepageBanner.primaryCtaHref,
                    secondaryCtaLabel: defaultHomepageBanner.secondaryCtaLabel,
                    secondaryCtaHref: defaultHomepageBanner.secondaryCtaHref,
                  }))
                }
                className="button-secondary rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.18em]"
              >
                Reset to launch copy
              </button>
              <input
                name="announcementText"
                value={form.announcementText}
                onChange={onChange}
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                placeholder="Announcement text"
              />
              <input
                name="eyebrow"
                value={form.eyebrow}
                onChange={onChange}
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                placeholder="Eyebrow"
              />
              <input
                name="title"
                value={form.title}
                onChange={onChange}
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                placeholder="Banner title"
              />
              <textarea
                name="description"
                value={form.description}
                onChange={onChange}
                className="min-h-32 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                placeholder="Banner description"
              />
              <input
                name="imageUrl"
                value={form.imageUrl}
                onChange={onChange}
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                placeholder="Banner image path like /uploads/banners/home-banner.jpg"
              />
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  name="primaryCtaLabel"
                  value={form.primaryCtaLabel}
                  onChange={onChange}
                  className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                  placeholder="Primary CTA label"
                />
                <input
                  name="primaryCtaHref"
                  value={form.primaryCtaHref}
                  onChange={onChange}
                  className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                  placeholder="Primary CTA href"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  name="secondaryCtaLabel"
                  value={form.secondaryCtaLabel}
                  onChange={onChange}
                  className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                  placeholder="Secondary CTA label"
                />
                <input
                  name="secondaryCtaHref"
                  value={form.secondaryCtaHref}
                  onChange={onChange}
                  className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                  placeholder="Secondary CTA href"
                />
              </div>
              <button
                type="button"
                onClick={async () => {
                  await saveHomepageBanner(form);
                  setSaved(true);
                  window.setTimeout(() => setSaved(false), 1500);
                }}
                className="button-primary rounded-full px-5 py-3"
              >
                {saved ? "Saved" : "Save homepage"}
              </button>
            </div>

            <div className="space-y-4 rounded-[1.75rem] border border-[rgba(17,17,17,0.08)] bg-[rgba(17,17,17,0.02)] p-5">
              <div>
                <AdminSectionLabel>Preview notes</AdminSectionLabel>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">Content guidance</h2>
              </div>
              <p className="text-sm leading-7 text-[var(--muted)]">
                Put banner images inside `/frontend/public/uploads/banners/` and reference them as
                `/uploads/banners/your-file.jpg`. Keep copy sharp, campaign-led, and readable over the image.
              </p>
              <div className="rounded-[1.5rem] border border-[rgba(17,17,17,0.08)] bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--accent)]">
                  {form.eyebrow || "Eyebrow"}
                </p>
                <h3 className="display-font mt-3 text-4xl leading-none">{form.title || "Banner title"}</h3>
                <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                  {form.description || "Banner description"}
                </p>
              </div>
            </div>
          </div>
        </AdminPanel>
      </div>
    </AdminShell>
  );
}
