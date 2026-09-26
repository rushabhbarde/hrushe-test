"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FrameStatement } from "@/components/frame-statement";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

function CheckoutFailurePageContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="page-shell">
      <SiteHeader />
      <FrameStatement
        kicker="Payment not completed"
        words={["Not", "yet."]}
        body="The payment was cancelled or did not go through. Nothing was lost: your bag is exactly as you left it."
        reference={orderId}
        rows={[
          { label: "Payment", value: "Incomplete" },
          { label: "Bag", value: "Kept", done: true },
        ]}
        actions={[
          { href: "/checkout", label: "Try again" },
          { href: "/cart", label: "Back to bag" },
          { href: "/contact", label: "Need help" },
        ]}
      />
      <SiteFooter />
    </div>
  );
}

export default function CheckoutFailurePage() {
  return (
    <Suspense fallback={null}>
      <CheckoutFailurePageContent />
    </Suspense>
  );
}
