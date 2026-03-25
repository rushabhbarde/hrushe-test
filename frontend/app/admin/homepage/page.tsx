"use client";

import { AdminGuard } from "@/components/admin-guard";
import { useEffect, useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
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
    <div className="page-shell">
      <SiteHeader />
      <AdminGuard>
        <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
          <div className="grain-card rounded-[2rem] p-6 sm:p-8">
            <p className="eyebrow text-[var(--accent)]">Admin homepage</p>
            <h1 className="display-font mt-3 text-4xl">Update the home banner.</h1>
            <p className="mt-4 text-sm text-[var(--muted)]">
              Put banner images in `/frontend/public/uploads/banners/` and use a path like
              `/uploads/banners/home-banner.jpg`.
            </p>
            <div className="mt-8 grid gap-4">
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
                className="justify-self-start rounded-full border border-[var(--border)] px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-[var(--accent)] transition hover:bg-black/5"
              >
                Use brand campaign copy
              </button>
              <input
                name="announcementText"
                value={form.announcementText}
                onChange={onChange}
                className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
                placeholder="Announcement text"
              />
              <input
                name="eyebrow"
                value={form.eyebrow}
                onChange={onChange}
              className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
              placeholder="Eyebrow"
            />
              <input
                name="title"
                value={form.title}
                onChange={onChange}
              className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
              placeholder="Banner title"
            />
              <textarea
                name="description"
                value={form.description}
                onChange={onChange}
              className="min-h-32 rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
              placeholder="Banner description"
            />
              <input
                name="imageUrl"
                value={form.imageUrl}
                onChange={onChange}
              className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
              placeholder="Banner image path like /uploads/banners/home-banner.jpg"
            />
            <div className="grid gap-4 md:grid-cols-2">
                <input
                  name="primaryCtaLabel"
                  value={form.primaryCtaLabel}
                  onChange={onChange}
                className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
                placeholder="Primary CTA label"
              />
                <input
                  name="primaryCtaHref"
                  value={form.primaryCtaHref}
                  onChange={onChange}
                className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
                placeholder="Primary CTA href"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <input
                  name="secondaryCtaLabel"
                  value={form.secondaryCtaLabel}
                  onChange={onChange}
                className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
                placeholder="Secondary CTA label"
              />
                <input
                  name="secondaryCtaHref"
                  value={form.secondaryCtaHref}
                  onChange={onChange}
                className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
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
              className="button-primary rounded-full px-5 py-3 transition"
            >
              {saved ? "Saved" : "Save homepage"}
            </button>
            </div>
          </div>
        </main>
      </AdminGuard>
      <SiteFooter />
    </div>
  );
}
