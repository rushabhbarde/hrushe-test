import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const contactDetails = [
  {
    title: "Email",
    value: "team@hrushe.in",
    note: "For product questions, order help, returns, and collaborations.",
  },
  {
    title: "Phone",
    value: "+91 9112854988",
    note: "Available for customer support and order-related assistance.",
  },
  {
    title: "Instagram",
    value: "@hrushe.in",
    note: "Follow the brand for launches, styling edits, and drop updates.",
  },
];

export default function ContactPage() {
  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="eyebrow text-[var(--accent)]">Contact</p>
            <h1 className="display-font mt-4 text-5xl leading-tight sm:text-6xl">
              We would love to hear from you.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">
              Reach out through our main email or phone number for product questions,
              customer support, order updates, or collaboration-related conversations.
            </p>
          </div>
          <div className="grain-card rounded-[2rem] p-6 sm:p-8">
            <p className="eyebrow text-[var(--accent)]">Studio note</p>
            <p className="mt-4 text-base leading-8 text-[var(--muted)]">
              Response time is usually within 24 hours on business days. For order-related help,
              include your order number and the email used at checkout.
            </p>
          </div>
        </section>

        <section className="mt-12 grid gap-5 md:grid-cols-3">
          {contactDetails.map((item) => (
            <div key={item.title} className="grain-card rounded-[2rem] p-6">
              <p className="eyebrow text-[var(--accent)]">{item.title}</p>
              <p className="mt-4 text-2xl font-semibold">{item.value}</p>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{item.note}</p>
            </div>
          ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
