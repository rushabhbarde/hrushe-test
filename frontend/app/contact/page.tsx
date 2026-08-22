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
      <main className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
        <section className="grid gap-10 border-b border-[var(--border)] pb-12 lg:grid-cols-[1fr_0.72fr] lg:items-end lg:pb-16">
          <div>
            <p className="eyebrow text-[var(--muted)]">Contact</p>
            <h1 className="mt-5 max-w-[9ch] text-[2.2rem] font-medium uppercase leading-[0.94] tracking-[-0.035em] sm:text-[4.5rem] sm:leading-[0.92] sm:tracking-[-0.045em] lg:text-[5.5rem]">
              We’re here to help.
            </h1>
          </div>
          <div>
            <p className="max-w-xl text-[0.94rem] leading-7 text-[var(--muted)] sm:text-base">
              For order support, include your order number and the email or phone number used at checkout. We usually reply within one business day.
            </p>
            <Link href="/track-order" className="button-primary mt-8 inline-flex items-center justify-center px-7 text-[0.68rem] font-semibold uppercase">
              Track an order
            </Link>
          </div>
        </section>

        <section className="mt-12 grid gap-px bg-[var(--border)] md:grid-cols-3 lg:mt-16">
          {contactDetails.map((item) => (
            <a key={item.title} href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel={item.href.startsWith("http") ? "noreferrer" : undefined} className="hrushe-inverse-hover group bg-[var(--surface)] p-6 transition sm:p-8 lg:min-h-64">
              <p className="eyebrow text-[var(--muted)] transition group-hover:text-white/55">{item.title}</p>
              <p className="mt-8 text-xl font-medium sm:text-2xl">{item.value}</p>
              <p className="mt-5 max-w-xs text-sm leading-7 text-[var(--muted)] transition group-hover:text-white/60">{item.note}</p>
              <span className="mt-10 block text-lg" aria-hidden="true">↗</span>
            </a>
          ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
