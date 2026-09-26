import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const contactDetails = [
  {
    title: "Customer care",
    value: "team@hrushe.in",
    href: "mailto:team@hrushe.in",
    note: "Product, delivery, return, and order support.",
  },
  {
    title: "Phone",
    value: "+91 91128 54988",
    href: "tel:+919112854988",
    note: "Available Monday–Saturday, 10 AM–7 PM.",
  },
  {
    title: "Instagram",
    value: "@hrushe.in",
    href: "https://instagram.com/hrushe.in",
    note: "Collections, styling, and release updates.",
  },
];

export default function ContactPage() {
  return (
    <div className="page-shell bg-[var(--background)]">
      <SiteHeader />
      <main className="px-5 pb-16 pt-6 lg:px-10 lg:pb-24 lg:pt-12">
        <div className="mx-auto grid max-w-[1320px] gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
          <div className="flex flex-col gap-5">
            <span className="fr-mono fr-muted">Contact</span>
            <h1 className="fr-word text-[clamp(3.5rem,14vw,8rem)] lg:text-[clamp(4rem,7vw,8rem)]">Talk to us.</h1>
            <p className="max-w-md text-base leading-7 text-[var(--muted)]">
              For an order, include its number and the email or phone you used at checkout. We usually reply within one
              business day.
            </p>
            <Link href="/track-order" className="fr-button mt-2 max-w-sm">
              Track an order
            </Link>
          </div>

          <ul className="flex flex-col lg:pt-10">
            {contactDetails.map((item) => (
              <li key={item.title}>
                <a
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                  className="fr-index-row is-active group !grid-cols-[minmax(0,1fr)_auto] py-5!"
                >
                  <span className="flex min-w-0 flex-col gap-2">
                    <span className="fr-mono">{item.title}</span>
                    <span className="fr-word break-words text-[clamp(1.75rem,4vw,3rem)] normal-case!">{item.value}</span>
                    <span className="text-sm leading-6 text-[var(--muted)]">{item.note}</span>
                  </span>
                  <span aria-hidden="true" className="text-2xl">
                    ↗
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
