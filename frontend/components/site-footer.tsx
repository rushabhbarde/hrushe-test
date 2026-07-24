"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import {
  HRUSHE_LOGO_DIMENSIONS,
  HRUSHE_LOGO_PATH,
  HRUSHE_SYMBOL_LOGO_DIMENSIONS,
  HRUSHE_SYMBOL_LOGO_PATH,
} from "@/lib/brand-assets";
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
    title: "The Edit",
    links: [
      { href: "/shop", label: "All pieces" },
      { href: "/women", label: "Women" },
      { href: "/men", label: "Men" },
      { href: "/collection/t-shirts", label: "T-shirts" },
    ],
  },
  {
    title: "Client Care",
    links: [
      { href: "/track-order", label: "Track order" },
      { href: "/policies?tab=shipping", label: "Shipping" },
      { href: "/policies?tab=returns", label: "Returns" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Maison",
    links: [
      { href: "/story", label: "Our story" },
      { href: "/shop", label: "The collection" },
      { href: "/contact", label: "Private assistance" },
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

const serviceNotes = [
  {
    title: "Signature Dispatch",
    copy: "Ships in 1-3 business days with careful packing.",
  },
  {
    title: "Size Concierge",
    copy: "One complimentary size exchange on eligible pieces.",
  },
  {
    title: "Assisted Care",
    copy: "Client services available Monday-Saturday.",
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
      <footer className="relative flex min-h-[calc(100svh-3.375rem)] flex-col justify-between overflow-hidden border-t border-white/10 bg-black text-white sm:min-h-0">
        <div className="mx-auto grid w-full max-w-[1600px] flex-1 content-center gap-10 px-6 py-12 sm:flex-none sm:px-8 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.42fr)] md:items-end lg:px-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center border border-white/12 bg-white/[0.03]">
                <Image
                  src={HRUSHE_SYMBOL_LOGO_PATH}
                  alt=""
                  width={HRUSHE_SYMBOL_LOGO_DIMENSIONS.width}
                  height={HRUSHE_SYMBOL_LOGO_DIMENSIONS.height}
                  className="h-9 w-9 object-contain"
                />
              </span>
              <p className="eyebrow text-white/45">{settings.brandName} Atelier</p>
            </div>
            <p className="mt-8 max-w-[11ch] text-5xl font-medium uppercase leading-none text-white sm:text-6xl lg:text-7xl">
              Defined Quietly.
            </p>
            <p className="mt-7 max-w-xl text-base leading-8 text-white/62">
              Premium everyday uniforms shaped with restraint, honest materials, and repeat-wear construction.
            </p>
          </div>

          <nav className="grid gap-3 border-l border-white/10 pl-6 text-sm text-white/72 md:justify-end">
            {[
              { href: "/shop", label: "Shop the edit" },
              { href: "/story", label: "Maison story" },
              { href: "/contact", label: "Client services" },
            ].map((link) => (
              <Link key={link.href} href={link.href} className="group flex items-center justify-between gap-5 py-1 hover:text-white">
                <span>{link.label}</span>
                <span aria-hidden="true" className="text-white/35 transition group-hover:translate-x-1 group-hover:text-white">
                  →
                </span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 px-6 py-5 text-[10px] uppercase tracking-[0.16em] text-white/45 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
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
    <footer className="relative overflow-hidden border-t border-white/10 bg-black text-white">
      <div className="mx-auto w-full max-w-[1600px] px-4 pt-14 sm:px-6 lg:px-8 lg:pt-20">
        <div className="grid gap-3 border-y border-white/10 py-4 md:grid-cols-3">
          {serviceNotes.map((note) => (
            <div key={note.title} className="border-white/10 py-4 md:border-l md:first:border-l-0 md:pl-7 md:first:pl-0">
              <p className="eyebrow text-white/50">{note.title}</p>
              <p className="mt-3 max-w-xs text-sm leading-6 text-white/58">{note.copy}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1600px] gap-12 px-4 py-14 sm:px-6 md:grid-cols-[1.1fr_1fr] lg:grid-cols-[1.2fr_repeat(4,minmax(0,0.58fr))] lg:gap-10 lg:px-8 lg:py-20">
        <section className="max-w-2xl md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-5">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center border border-white/12 bg-white/[0.03]">
              <Image
                src={HRUSHE_SYMBOL_LOGO_PATH}
                alt=""
                width={HRUSHE_SYMBOL_LOGO_DIMENSIONS.width}
                height={HRUSHE_SYMBOL_LOGO_DIMENSIONS.height}
                className="h-11 w-11 object-contain"
              />
            </span>
            <Image
              src={HRUSHE_LOGO_PATH}
              alt={settings.brandName}
              width={HRUSHE_LOGO_DIMENSIONS.width}
              height={HRUSHE_LOGO_DIMENSIONS.height}
              className="h-8 w-auto max-w-[13rem] object-contain opacity-95"
            />
          </div>

          <p className="mt-10 max-w-[11ch] text-5xl font-medium uppercase leading-none text-white sm:text-6xl lg:text-7xl">
            Quiet luxury, made wearable.
          </p>
          <p className="mt-7 max-w-lg text-base leading-8 text-white/60">
            Clear silhouettes, grounded materials, and an understated finish for the pieces you return to.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/shop" className="hrushe-light-action inline-flex min-h-12 items-center justify-center border border-white px-5 text-[0.68rem] font-semibold uppercase tracking-[0.14em]">
              Shop the edit
            </Link>
            <Link href="/story" className="inline-flex min-h-12 items-center justify-center border border-white/18 px-5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-white/76 hover:border-white/46 hover:text-white">
              The maison
            </Link>
          </div>
        </section>

        {footerGroups.map((group) => (
          <div key={group.title}>
            <p className="eyebrow text-white/50">{group.title}</p>
            <div className="mt-6 space-y-4 text-sm text-white/66">
              {group.links.map((link) => (
                <Link key={`${group.title}-${link.href}-${link.label}`} href={link.href} className="group flex w-fit items-center gap-2 hover:text-white">
                  {link.label}
                  <span aria-hidden="true" className="text-white/0 transition group-hover:translate-x-1 group-hover:text-white/42">
                    →
                  </span>
                </Link>
              ))}
              {group.title === "Legal" ? (
                <button
                  type="button"
                  onClick={openCookiePreferences}
                  className="block text-left text-white/66 hover:text-white"
                >
                  Cookie preferences
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto grid w-full max-w-[1600px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_minmax(18rem,0.46fr)] lg:items-end lg:px-8">
          <div>
            <p className="eyebrow text-white/50">Private client services</p>
            <div className="mt-5 flex flex-col gap-3 text-sm text-white/70 sm:flex-row sm:flex-wrap sm:gap-x-8">
              {contactLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noreferrer" : undefined}
                  className="block hover:text-white"
                >
                  {link.label}
                </a>
              ))}
              {socialLinks.map((link) => (
                <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className="block hover:text-white">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <p className="max-w-md text-sm leading-7 text-white/45 lg:justify-self-end lg:text-right">
            For the quickest response, include your order number. Every note is handled by the HRUSHE client desk.
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-5 text-[10px] uppercase tracking-[0.16em] text-white/42 sm:px-6 sm:pb-5 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>&copy; 2026 HRUSHE. All rights reserved.</p>
          <p>Designed in India / Defined quietly</p>
        </div>
      </div>
    </footer>
  );
}
