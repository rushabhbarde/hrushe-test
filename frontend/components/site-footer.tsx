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
      { href: "/shop?sort=newest", label: "New arrivals" },
      { href: "/shop", label: "All pieces" },
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

const serviceHighlights = [
  { label: "Dispatch", value: "1-3 business days" },
  { label: "Exchange", value: "One free size exchange" },
  { label: "Returns", value: "7-day returns" },
  { label: "Support", value: "Monday-Saturday" },
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
  const socialLinks = [
    { href: settings.instagramUrl, label: "Instagram" },
    { href: settings.facebookUrl, label: "Facebook" },
    { href: settings.pinterestUrl, label: "Pinterest" },
  ].filter((link) => Boolean(link.href));
  const contactLinks = [
    { href: `mailto:${settings.contactEmail}`, label: settings.contactEmail },
    phoneDigits ? { href: `tel:+${phoneDigits}`, label: settings.contactPhone } : null,
    whatsappDigits
      ? { href: `https://wa.me/${whatsappDigits}`, label: "WhatsApp concierge", external: true }
      : null,
  ].filter(Boolean) as { href: string; label: string; external?: boolean }[];

  if (compact) {
    return (
      <footer className="flex min-h-[calc(100svh-3.375rem)] flex-col justify-between border-t border-white/15 bg-black text-white sm:min-h-0">
        <div className="mx-auto grid w-full max-w-[1600px] flex-1 content-center gap-9 px-6 py-12 sm:flex-none sm:px-8 md:grid-cols-[1fr_auto] md:items-end lg:px-10">
          <div className="max-w-lg">
            <p className="eyebrow text-white/45">{settings.brandName}</p>
            <p className="mt-3 text-[2rem] font-medium uppercase leading-none text-white sm:text-[2.6rem]">
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
    <footer className="border-t border-white/15 bg-black text-white">
      <div className="mx-auto flex min-h-[34rem] w-full max-w-[1600px] flex-col px-4 sm:px-6 md:min-h-[clamp(34rem,72svh,48rem)] lg:px-8">
        <div className="grid flex-1 gap-8 py-8 md:grid-cols-[0.92fr_1.08fr] md:py-10 lg:gap-14 lg:py-12">
          <section className="flex flex-col justify-between gap-8">
            <div className="max-w-xl">
              <p className="eyebrow text-white/55">{settings.brandName}</p>
              <p className="mt-4 max-w-[12ch] text-[2.25rem] font-medium uppercase leading-[0.96] text-white sm:text-[3.25rem]">
                Defined Quietly.
              </p>
              <p className="mt-5 max-w-md text-sm leading-6 text-white/60 sm:text-[0.95rem]">
                Quiet everyday uniforms with clear proportions, honest materials, and repeat-wear construction.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-px border border-white/15 bg-white/15 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4">
              {serviceHighlights.map((item) => (
                <div key={item.label} className="min-h-20 bg-black p-3 sm:min-h-24 sm:p-4">
                  <p className="eyebrow text-white/38">{item.label}</p>
                  <p className="mt-3 text-sm leading-5 text-white/78">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-2 content-start gap-x-6 gap-y-8 lg:grid-cols-4">
            {footerGroups.map((group) => (
              <div key={group.title} className="border-t border-white/15 pt-5">
                <p className="eyebrow text-white/45">{group.title}</p>
                <div className="mt-5 space-y-3.5 text-sm text-white/75 md:space-y-4">
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
        </div>

        <div className="border-t border-white/15 py-5">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="eyebrow text-white/45">Client services</p>
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm text-white/75 sm:flex sm:flex-wrap sm:gap-x-8">
                {contactLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noreferrer" : undefined}
                    className="block hover:text-white"
                  >
                    {link.label === "WhatsApp concierge" ? "WhatsApp support" : link.label}
                  </a>
                ))}
                {socialLinks.map((link) => (
                  <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className="block hover:text-white">
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
            <p className="max-w-sm text-xs leading-6 text-white/45 md:text-right">
              Support is available Monday-Saturday. Include your order number for the quickest response.
            </p>
          </div>
        </div>

        <div className="border-t border-white/15 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-4">
          <div className="flex flex-col gap-2 text-[10px] uppercase tracking-[0.14em] text-white/45 md:flex-row md:items-center md:justify-between">
            <p>&copy; 2026 HRUSHE. All rights reserved.</p>
            <p>Designed in India / Defined quietly</p>
          </div>
          <p aria-label="HRUSHE" className="mt-3 select-none overflow-hidden text-center text-[clamp(4.15rem,18vw,15.5rem)] font-semibold uppercase leading-[0.75] text-white">
            HRUSHE
          </p>
        </div>
      </div>
    </footer>
  );
}
