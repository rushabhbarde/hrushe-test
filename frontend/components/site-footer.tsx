"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

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
      { href: "/shop", label: "Collections" },
      { href: "/new-in", label: "New In" },
      { href: "/story", label: "Story" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/track-order", label: "Track order" },
      { href: "/policies?tab=shipping", label: "Shipping" },
      { href: "/policies?tab=returns", label: "Returns" },
      { href: "/policies?tab=privacy", label: "Privacy" },
    ],
  },
];

export function SiteFooter() {
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

  return (
    <footer className="border-t border-white/15 bg-[var(--foreground)] text-[var(--background)]">
      <div className="mx-auto grid w-full max-w-[1600px] gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.5fr_0.75fr_0.75fr_1fr] lg:px-8 lg:py-24">
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
            </div>
          </div>
        ))}

        <div>
          <p className="eyebrow text-white/45">Contact</p>
          <div className="mt-5 space-y-4 text-sm text-white/75">
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
