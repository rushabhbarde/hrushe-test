"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { LoadingState } from "@/components/loading-state";

const policyTabs = [
  {
    key: "terms",
    label: "Terms & Conditions",
    sections: [
      {
        title: "1. General",
        body:
          "HRUSHE (“we”, “our”, “us”) operates the website hrushe.in. By using our website, you agree to these Terms & Conditions.",
      },
      {
        title: "2. Products & Pricing",
        body:
          "Products and prices may change without notice. All items depend on availability.",
      },
      {
        title: "3. Order Acceptance",
        body:
          "We may cancel orders due to unavailability, payment errors, or suspected fraud. You will receive an email confirmation after placing an order.",
      },
      {
        title: "4. Payments",
        body:
          "Payments made through our website are processed securely. We do not store card or banking details.",
      },
      {
        title: "5. Shipping",
        body:
          "Please refer to our Shipping Policy for delivery timelines and details.",
      },
      {
        title: "6. Returns & Refunds",
        body:
          "Returns and refunds follow our Return & Refund Policy. Please read it before placing an order.",
      },
      {
        title: "7. Intellectual Property",
        body:
          "All content on this website is owned by HRUSHE. Copying or misuse is not allowed.",
      },
      {
        title: "8. Limitation of Liability",
        body:
          "Courier delays and incorrect address issues are handled case by case. If an item arrives damaged, contact us within 48 hours so the order can be assessed under our Return & Refund Policy.",
      },
      {
        title: "9. Contact",
        body:
          "For any questions, please contact us at: team@hrushe.in\n\nTrade name: HRUSHE (HRUSHABH BARDE)\nPhone number: +91 9112854988\nEmail: team@hrushe.in\nPhysical address: 1, Barde Farms, Near Primary Health Sub Centre, Ganeshpur, Wani, Maharashtra, 445304.",
      },
    ],
  },
  {
    key: "privacy",
    label: "Privacy Policy",
    sections: [
      {
        title: "1. Information We Collect",
        body:
          "We may collect your name, email, phone number, address, and order details. Payment details are processed by secure payment gateways.",
      },
      {
        title: "2. How We Use Your Information",
        body:
          "We use your data to process orders, improve the website, and provide customer support. Marketing communication is sent only with your permission.",
      },
      {
        title: "3. Sharing Your Information",
        body:
          "We share required information with courier partners, payment gateways, and trusted service providers. We never sell personal data.",
      },
      {
        title: "4. Cookies",
        body:
          "HRUSHE uses essential cookies and similar local-storage technologies for secure login, fraud prevention, cart, checkout, theme, and privacy preferences. These are required for the website to function. Optional analytics and marketing technologies are disabled unless you choose to enable them through the cookie banner. You can review or change that choice at any time using Cookie preferences in the footer.",
      },
      {
        title: "5. Data Security",
        body:
          "We follow industry standards to protect your personal information.",
      },
      {
        title: "6. Your Rights",
        body:
          "You may request data correction or deletion at any time.",
      },
      {
        title: "7. Contact",
        body:
          "For privacy-related concerns, contact: team@hrushe.in\n\nHRUSHABH BARDE",
      },
    ],
  },
  {
    key: "shipping",
    label: "Shipping Policy",
    sections: [
      {
        title: "1. Order Processing",
        body:
          "Orders are processed within 1–3 business days. Tracking information is shared once dispatched.",
      },
      {
        title: "2. Delivery Time",
        body:
          "Orders are usually delivered within 5–10 business days after confirmation. Remote areas may take longer, and tracking is shared after dispatch.",
      },
      {
        title: "3. Shipping Charges",
        body:
          "Standard shipping is complimentary across India. Any exceptional delivery charge will be shown clearly before payment.",
      },
      {
        title: "4. Incorrect Address",
        body:
          "We are not responsible for delivery failures caused by incorrect addresses. Additional charges may apply for re-delivery.",
      },
      {
        title: "5. Delivery Delays",
        body:
          "Delays may occur due to weather, festivals, or courier issues. These are outside our control.",
      },
      {
        title: "6. Contact",
        body:
          "For shipping-related concerns, contact: team@hrushe.in\n\nHRUSHABH BARDE",
      },
    ],
  },
  {
    key: "returns",
    label: "Return & Refund Policy",
    sections: [
      {
        title: "1. Return Eligibility",
        body:
          "Eligible unworn products may be returned within 7 days of delivery. Items must retain their original tags and packaging. Final-sale or hygiene-sensitive exclusions, if any, will be stated clearly on the product page before purchase.",
      },
      {
        title: "2. Conditions for Return",
        body:
          "Products must be unused, unwashed, and returned with original tags and packaging. For damaged, defective, or incorrect items, contact HRUSHE promptly with clear photos so support can resolve the issue.",
      },
      {
        title: "3. Refund Process",
        body:
          "After the returned item is received and checked, an approved refund is initiated to the original payment method. Bank processing time is typically 5–7 business days after initiation.",
      },
      {
        title: "4. Exchange",
        body:
          "One size exchange is available at no additional pickup or reshipping charge, subject to stock availability and the same unused, unwashed, tagged condition. Additional exchanges may incur logistics charges. Colour changes are processed as a return and new order.",
      },
      {
        title: "5. Cancellation",
        body:
          "Orders can be cancelled within 2 hours of placing them. After dispatch, cancellation is not possible.",
      },
      {
        title: "6. Contact",
        body:
          "For return or refund support: team@hrushe.in\n\nHRUSHABH BARDE",
      },
    ],
  },
] as const;

function PoliciesPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "terms";

  const currentPolicy =
    useMemo(
      () => policyTabs.find((policy) => policy.key === activeTab) || policyTabs[0],
      [activeTab]
    );

  const switchPolicy = (key: (typeof policyTabs)[number]["key"]) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
        <div className="max-w-4xl">
          <p className="eyebrow text-[var(--muted)]">Policies</p>
          <h1 className="mt-5 max-w-[13ch] text-[2.5rem] font-medium uppercase leading-[0.95] tracking-[-0.04em] sm:text-[3.5rem] lg:text-[4.5rem]">
            Clear information, before you order.
          </h1>
          <p className="mt-6 max-w-2xl text-[0.94rem] leading-7 text-[var(--muted)] sm:text-base">
            Shipping, returns, privacy, and purchase terms—kept in one place and written to be understood.
          </p>
          <p className="mt-4 text-[0.68rem] uppercase tracking-[0.12em] text-[var(--muted)]">Last updated: 21 June 2026</p>
        </div>

        <div className="mt-10 grid min-w-0 gap-10 lg:grid-cols-[300px_1fr]">
          <aside className="min-w-0" aria-label="Policy sections">
            <div className="-mx-4 flex max-w-full gap-2 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:block lg:space-y-3 lg:overflow-visible lg:px-0 lg:pb-0" role="tablist">
              {policyTabs.map((policy) => {
                const isActive = currentPolicy.key === policy.key;

                return (
                  <button
                    key={policy.key}
                    id={`policy-tab-${policy.key}`}
                    type="button"
                    onClick={() => switchPolicy(policy.key)}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls="active-policy-panel"
                    className={`block min-h-12 min-w-max shrink-0 border px-5 py-4 text-left transition lg:w-full ${
                      isActive
                        ? "hrushe-inverse-action"
                        : "border-[var(--border)] bg-white text-[var(--foreground)] hover:bg-black/5"
                    }`}
                  >
                    <span className="text-base font-semibold">{policy.label}</span>
                  </button>
                );
              })}
            </div>

            <Link
              href="/contact"
              className="button-secondary hidden px-5 py-3 transition lg:mt-4 lg:inline-flex"
            >
              Need support?
            </Link>
          </aside>

          <section id="active-policy-panel" role="tabpanel" aria-labelledby={`policy-tab-${currentPolicy.key}`} className="min-w-0 overflow-hidden border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 lg:p-12">
            <p className="eyebrow text-[var(--muted)]">{currentPolicy.label}</p>
            <h2 className="mt-5 text-3xl font-medium tracking-[-0.025em]">
              {currentPolicy.label}
            </h2>
            <div className="mt-8 space-y-8">
              {currentPolicy.sections.map((section) => (
                <div key={section.title}>
                  <h3 className="text-lg font-medium">{section.title}</h3>
                  <div className="mt-3 max-w-3xl space-y-3 break-words text-[0.94rem] leading-7 text-[var(--muted)]">
                    {section.body.split("\n").map((paragraph) => (
                      <p key={`${section.title}-${paragraph}`}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export default function PoliciesPage() {
  return (
    <Suspense fallback={(
      <div className="page-shell">
        <SiteHeader />
        <main className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8 lg:py-24">
          <LoadingState title="Preparing policies" description="Loading the requested policy section." />
        </main>
        <SiteFooter />
      </div>
    )}>
      <PoliciesPageContent />
    </Suspense>
  );
}
