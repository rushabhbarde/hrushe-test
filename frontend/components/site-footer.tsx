import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16">
      <section className="bg-[#2f2d2b] text-white">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:py-16">
          <div className="max-w-3xl">
            <p className="eyebrow text-white/55">Community & collaborations</p>
            <p className="display-font mt-3 text-3xl leading-tight sm:mt-4 sm:text-4xl lg:text-5xl">
              Want To Become A Fashion Influencer?
            </p>
            <p className="mt-3 max-w-2xl text-base leading-7 text-white/78 sm:mt-4 sm:text-lg sm:leading-8">
              We help creators, stylists, and fashion-forward communities build a stronger
              personal style through premium everyday essentials.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex min-h-12 w-full items-center justify-center border border-white/8 bg-black px-8 py-4 text-base font-semibold text-white transition hover:bg-[#171717] sm:w-auto sm:py-5"
          >
            Get in touch with us
          </Link>
        </div>
      </section>

      <section className="border-t border-black/5 bg-white">
        <div className="mx-auto grid w-full max-w-[1600px] gap-10 px-4 py-12 sm:px-6 lg:px-8 lg:grid-cols-[1.05fr_1fr_0.9fr] lg:gap-12 lg:py-16">
          <div className="space-y-6 sm:space-y-8">
            <div>
              <p className="eyebrow text-[var(--accent)]">HRUSHE</p>
              <p className="display-font mt-3 max-w-sm text-3xl leading-tight text-[var(--foreground)] sm:mt-4 sm:text-5xl">
                BE A PART OF HRUSHE.
              </p>
            </div>
            <p className="max-w-md text-sm leading-7 text-[var(--muted)] sm:text-base sm:leading-8">
              Minimal everyday style with premium comfort, thoughtful quality, and a cleaner
              way to build a modern wardrobe.
            </p>
            <div className="space-y-2.5 text-base text-[var(--foreground)] sm:text-lg">
              <a href="mailto:team@hrushe.in" className="block">
                team@hrushe.in
              </a>
              <a href="tel:+919112854988" className="block">
                +91 9112854988
              </a>
              <a
                href="https://instagram.com/hrushe.in"
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                @hrushe.in
              </a>
            </div>
            <p className="text-sm text-[var(--muted)]">Copyright © HRUSHE</p>
          </div>

          <div className="space-y-6 sm:space-y-8">
            <div>
              <p className="eyebrow text-[var(--accent)]">About the brand</p>
              <p className="mt-3 text-base leading-8 text-[var(--foreground)] sm:mt-4 sm:text-lg sm:leading-9">
                We are Hrushe — a passionate team focused on improving how people express
                themselves through fashion. Our products and services are thoughtfully designed
                for modern wardrobes and growing communities.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/story"
                className="inline-flex rounded-full bg-black px-5 py-3 text-sm font-semibold !text-white transition hover:bg-[#171717] hover:!text-white"
              >
                Our story
              </Link>
              <Link
                href="/shop"
                className="inline-flex rounded-full border border-black/12 bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-black/5"
              >
                Shop collection
              </Link>
              <Link
                href="/contact"
                className="inline-flex rounded-full border border-black/12 bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-black/5"
              >
                Contact
              </Link>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1 lg:gap-8">
            <div>
              <p className="eyebrow text-[var(--accent)]">Customer service</p>
              <div className="mt-4 space-y-3 text-sm text-[var(--muted)]">
                <Link href="/track-order" className="block text-[var(--foreground)]">
                  Track Order
                </Link>
                <Link href="/policies?tab=shipping" className="block">
                  Shipping Policy
                </Link>
                <Link href="/policies?tab=returns" className="block">
                  Return & Refund Policy
                </Link>
                <Link href="/policies?tab=privacy" className="block">
                  Privacy Policy
                </Link>
                <Link href="/policies?tab=terms" className="block">
                  Terms & Conditions
                </Link>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-black/8 bg-white/70 p-5">
              <p className="eyebrow text-[var(--accent)]">Support hours</p>
              <p className="mt-4 text-base leading-8 text-[var(--foreground)]">
                Monday to Saturday
                <br />
                10 AM to 7 PM
              </p>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                For order help, include your order number and checkout email.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-black/6">
          <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 px-4 py-5 text-xs uppercase tracking-[0.16em] text-[var(--muted)] sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
            <span>Modern everyday style by HRUSHE</span>
            <span>Clean essentials. Honest comfort. Everyday confidence.</span>
          </div>
        </div>
      </section>
    </footer>
  );
}
