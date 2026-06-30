"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { openCookiePreferences } from "@/lib/cookie-consent";

type PublicWebsiteSettings = {
  brandName: string;
  contactEmail: string;
  contactPhone: string;
  supportWhatsapp: string;
  instagramUrl: string;
  facebookUrl: string;
  pinterestUrl: string;
};

const defaultSettings: PublicWebsiteSettings = {
  brandName: "HRUSHE",
  contactEmail: "team@hrushe.in",
  contactPhone: "+91 91128 54988",
  supportWhatsapp: "+91 91128 54988",
  instagramUrl: "https://instagram.com/hrushe.in",
  facebookUrl: "",
  pinterestUrl: "",
};

const footerGroups = [
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "All pieces" },
      { href: "/new-in", label: "New In" },
      { href: "/collection/t-shirts", label: "T-Shirts" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/track-order", label: "Track order" },
      { href: "/policies?tab=shipping", label: "Shipping" },
      { href: "/policies?tab=returns", label: "Returns" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Brand",
    links: [
      { href: "/story", label: "Our story" },
      { href: "/shop", label: "The collection" },
      { href: "/new-in", label: "Latest release" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/policies?tab=privacy", label: "Privacy" },
      { href: "/policies?tab=terms", label: "Terms" },
      { href: "/policies?tab=returns", label: "Return policy" },
    ],
  },
];

export function SiteFooter({ compact = false }: { compact?: boolean }) {
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    let active = true;
    void apiRequest<PublicWebsiteSettings>("/content/settings")
      .then((response) => {
        if (active) setSettings(response);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const phoneDigits = settings.contactPhone.replace(/\D/g, "");
  const whatsappDigits = settings.supportWhatsapp.replace(/\D/g, "");

  if (compact) {
    return (
      <footer className="border-t border-white/15 bg-[var(--foreground)] text-[var(--background)]">
        <div className="mx-auto grid w-full max-w-[1600px] gap-9 px-6 py-10 sm:px-8 md:grid-cols-[1fr_auto] md:items-end lg:px-10">
          <div className="max-w-lg">
            <p className="eyebrow text-white/45">{settings.brandName}</p>
            <p className="mt-3 text-[2rem] font-medium uppercase leading-none tracking-[-0.04em] text-white sm:text-[2.6rem]">
              Defined Quietly.
            </p>
            <p className="mt-4 text-sm leading-6 text-white/55">
              Everyday uniforms, clear proportions, honest materials.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/72 md:justify-end">
            <Link href="/women" className="hover:text-white">
              Women
            </Link>
            <Link href="/men" className="hover:text-white">
              Men
            </Link>
            <Link href="/new-in" className="hover:text-white">
              New In
            </Link>
            <Link href="/contact" className="hover:text-white">
              Contact
            </Link>
          </nav>
        </div>

        <div className="border-t border-white/15">
          <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 px-6 py-5 text-[10px] uppercase tracking-[0.14em] text-white/45 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
            <p>&copy; 2026 HRUSHE. All rights reserved.</p>
            <a href={`mailto:${settings.contactEmail}`} className="hover:text-white">
              {settings.contactEmail}
            </a>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-white/15 bg-[var(--foreground)] text-[var(--background)]">
      <div className="mx-auto grid w-full max-w-[1600px] gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,minmax(0,0.62fr))] lg:px-8 lg:py-24">
        <div className="max-w-xl">
          <p className="eyebrow text-white/55">{settings.brandName}</p>
          <p className="mt-5 max-w-[12ch] text-[2.25rem] font-medium uppercase leading-[0.96] tracking-[-0.04em] text-[var(--background)] sm:text-[3.5rem]">
            Defined Quietly.
          </p>
          <p className="mt-6 max-w-md text-sm leading-7 text-white/60 sm:text-[0.95rem]">
            Quiet everyday uniforms with clear proportions, honest materials, and repeat-wear construction.
          </p>
        </div>

        {footerGroups.map((group) => (
          <div key={group.title}>
            <p className="eyebrow text-white/45">{group.title}</p>
            <div className="mt-5 space-y-4 text-sm text-white/75">
              {group.links.map((link) => (
                <Link key={link.href} href={link.href} className="block hover:text-white">
                  {link.label}
                </Link>
              ))}
              {group.title === "Legal" ? (
                <button
                  type="button"
                  onClick={openCookiePreferences}
                  className="block text-left hover:text-white"
                >
                  Cookie preferences
                </button>
              ) : null}
            </div>
          </div>
        ))}

      </div>

      <div className="border-t border-white/15">
        <div className="mx-auto grid w-full max-w-[1600px] gap-8 px-4 py-8 sm:px-6 md:grid-cols-[1fr_auto] md:items-end lg:px-8">
          <div>
            <p className="eyebrow text-white/45">Client services</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-white/75 sm:flex-row sm:flex-wrap sm:gap-x-8">
            <a href={`mailto:${settings.contactEmail}`} className="block hover:text-white">
              {settings.contactEmail}
            </a>
            <a href={`tel:+${phoneDigits}`} className="block hover:text-white">
              {settings.contactPhone}
            </a>
            {whatsappDigits ? <a
              href={`https://wa.me/${whatsappDigits}`}
              target="_blank"
              rel="noreferrer"
              className="block hover:text-white"
            >
              WhatsApp support
            </a> : null}
            {settings.instagramUrl ? <a href={settings.instagramUrl} target="_blank" rel="noreferrer" className="block hover:text-white">Instagram</a> : null}
            {settings.facebookUrl ? <a href={settings.facebookUrl} target="_blank" rel="noreferrer" className="block hover:text-white">Facebook</a> : null}
            {settings.pinterestUrl ? <a href={settings.pinterestUrl} target="_blank" rel="noreferrer" className="block hover:text-white">Pinterest</a> : null}
            </div>
          </div>
          <p className="max-w-sm text-xs leading-6 text-white/45 md:text-right">
            Support is available Monday–Saturday. Include your order number for the quickest response.
          </p>
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-5 text-[10px] uppercase tracking-[0.14em] text-white/45 sm:px-6 sm:pb-5 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>&copy; 2026 HRUSHE. All rights reserved.</p>
          <p>Designed in India · Defined quietly</p>
        </div>
      </div>
    </footer>
  );
}
