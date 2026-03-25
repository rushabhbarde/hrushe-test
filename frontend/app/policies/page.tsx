"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

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
          "We are not responsible for courier delays, wrong address issues, or damage caused during transit.",
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
          "Cookies help us improve user experience. You can disable cookies through your browser settings.",
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
          "Products will be delivered within 5–10 business days. Remote areas may take longer.",
      },
      {
        title: "3. Shipping Charges",
        body:
          "Shipping charges are shown at checkout. Free shipping may apply to selected products or order values.",
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
          "Returns are accepted only if the product is damaged, defective, or if the wrong item is delivered. You must request a return within 48 hours of delivery. We have a 7 day return policy after request.",
      },
      {
        title: "2. Conditions for Return",
        body:
          "Product must be unused and in original packaging. An unboxing video or photo is required for damaged or wrong item claims.",
      },
      {
        title: "3. Refund Process",
        body:
          "After approval, refunds are credited within 5–7 business days to the original payment method. Shipping fees are non-refundable.",
      },
      {
        title: "4. Exchange",
        body:
          "We do not offer exchanges or replacements at the moment.",
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

export default function PoliciesPage() {
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
      <main className="mx-auto max-w-[1320px] px-5 py-12 sm:px-8 lg:py-14">
        <div className="max-w-4xl">
          <p className="eyebrow text-[var(--accent)]">Policies</p>
          <h1 className="display-font mt-4 text-4xl leading-tight sm:text-5xl lg:text-6xl">
            Legal, privacy, shipping, and return information in one place.
          </h1>
          <p className="mt-5 text-lg leading-8 text-[var(--muted)]">
            Browse one policy at a time so the information stays clear and easy to read before
            you place an order.
          </p>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[300px_1fr]">
          <aside className="space-y-3">
            {policyTabs.map((policy) => {
              const isActive = currentPolicy.key === policy.key;

              return (
                <button
                  key={policy.key}
                  type="button"
                  onClick={() => switchPolicy(policy.key)}
                  className={`block w-full rounded-[1.25rem] border px-5 py-4 text-left transition ${
                    isActive
                      ? "border-black bg-black text-white"
                      : "border-[var(--border)] bg-white text-[var(--foreground)] hover:bg-black/5"
                  }`}
                >
                  <span className="text-base font-semibold">{policy.label}</span>
                </button>
              );
            })}

            <Link
              href="/contact"
              className="button-secondary mt-4 inline-flex rounded-full px-5 py-3 transition"
            >
              Need support?
            </Link>
          </aside>

          <section className="grain-card rounded-[2rem] p-6 sm:p-8 lg:p-10">
            <p className="eyebrow text-[var(--accent)]">{currentPolicy.label}</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em]">
              {currentPolicy.label}
            </h2>
            <div className="mt-8 space-y-8">
              {currentPolicy.sections.map((section) => (
                <div key={section.title}>
                  <h3 className="text-xl font-semibold">{section.title}</h3>
                  <div className="mt-3 space-y-3 text-base leading-8 text-[var(--muted)]">
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
