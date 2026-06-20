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
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto grid w-full max-w-[1600px] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.3fr_0.8fr_0.8fr_1fr] lg:px-8 lg:py-20">
        <div className="max-w-xl">
          <p className="eyebrow text-[var(--muted)]">HRUSHE</p>
          <p className="mt-4 max-w-[12ch] text-[2.2rem] font-semibold uppercase leading-[0.96] tracking-[-0.07em] text-[var(--foreground)] sm:text-[3rem]">
            Quiet pieces.
            <br />
            Everyday ease.
          </p>
          <p className="mt-4 max-w-md text-sm leading-7 text-[var(--muted)] sm:text-[0.95rem]">
            A cleaner clothing brand focused on simple silhouettes, calmer colour stories, and
            repeat-wear essentials.
          </p>
        </div>

        {footerGroups.map((group) => (
          <div key={group.title}>
            <p className="eyebrow text-[var(--muted)]">{group.title}</p>
            <div className="mt-4 space-y-3 text-sm text-[var(--foreground)]">
              {group.links.map((link) => (
                <Link key={link.href} href={link.href} className="block hover:text-[var(--accent)]">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div>
          <p className="eyebrow text-[var(--muted)]">Contact</p>
          <div className="mt-4 space-y-3 text-sm text-[var(--foreground)]">
            <a href="mailto:team@hrushe.in" className="block hover:text-[var(--accent)]">
              Email: team@hrushe.in
            </a>
            <a href="tel:+919112854988" className="block hover:text-[var(--accent)]">
              Phone: +91 91128 54988
            </a>
            <a
              href="https://instagram.com/hrushe.in"
              target="_blank"
              rel="noreferrer"
              className="block hover:text-[var(--accent)]"
            >
              Instagram: @hrushe.in
            </a>
          </div>
          <div className="mt-6 border border-[var(--border)] px-4 py-4 text-sm leading-7 text-[var(--muted)]">
            <span className="block text-[0.68rem] uppercase tracking-[0.16em]">Support hours</span>
            <span className="mt-1 block text-[var(--foreground)]">Mon-Sat, 10 AM to 7 PM</span>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border)]">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-5 text-[11px] uppercase tracking-[0.16em] text-[var(--muted)] sm:px-6 sm:pb-5 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>&copy; 2026 HRUSHE. All rights reserved.</p>
          <p>Designed for everyday dressing</p>
        </div>
      </div>
    </footer>
  );
}
