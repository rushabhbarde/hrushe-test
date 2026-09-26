"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FrameStatement } from "@/components/frame-statement";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

function CheckoutPendingPageContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const trackingLookup = orderId ? `/track-order?orderId=${encodeURIComponent(orderId)}` : "/track-order";

  return (
    <div className="page-shell">
      <SiteHeader />
      <FrameStatement
        kicker="Payment pending"
        words={["One", "moment."]}
        frame={<span className="absolute inset-0 flex items-center justify-center"><span className="quiet-loader__track" /></span>}
        body="We are confirming your payment with the bank. If money has left your account, please do not pay again; this order will update on its own."
        reference={orderId}
        rows={[
          { label: "Payment", value: "Being verified" },
          { label: "Order", value: "On hold" },
        ]}
        actions={[
          { href: trackingLookup, label: "Track order" },
          { href: "/contact", label: "Contact us" },
          { href: "/shop", label: "Continue shopping" },
        ]}
      />
      <SiteFooter />
    </div>
  );
}

export default function CheckoutPendingPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutPendingPageContent />
    </Suspense>
  );
}
