import Link from "next/link";

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
  return (
    <footer className="border-t border-white/15 bg-[var(--foreground)] text-[var(--background)]">
      <div className="mx-auto grid w-full max-w-[1600px] gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.5fr_0.75fr_0.75fr_1fr] lg:px-8 lg:py-24">
        <div className="max-w-xl">
          <p className="eyebrow text-white/55">HRUSHE</p>
          <p className="mt-5 max-w-[12ch] text-[2.25rem] font-medium uppercase leading-[0.96] tracking-[-0.04em] text-[var(--background)] sm:text-[3.5rem]">
            Defined Quietly.
          </p>
          <p className="mt-6 max-w-md text-sm leading-7 text-white/60 sm:text-[0.95rem]">
            Considered silhouettes, quieter colour stories, and cotton essentials made for repeat wear.
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
            <a href="mailto:team@hrushe.in" className="block hover:text-white">
              team@hrushe.in
            </a>
            <a href="tel:+919112854988" className="block hover:text-white">
              +91 91128 54988
            </a>
            <a
              href="https://instagram.com/hrushe.in"
              target="_blank"
              rel="noreferrer"
              className="block hover:text-white"
            >
              @hrushe.in
            </a>
          </div>
          <div className="mt-8 border-t border-white/20 pt-5 text-sm leading-7 text-white/55">
            <span className="block text-[0.68rem] uppercase tracking-[0.16em]">Support hours</span>
            <span className="mt-1 block text-white/80">Mon–Sat, 10 AM–7 PM</span>
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
