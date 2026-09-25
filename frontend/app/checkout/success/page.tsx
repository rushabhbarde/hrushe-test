"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { useCustomerAuth } from "@/components/customer-auth-provider";
import { FrameStatement } from "@/components/frame-statement";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

function CheckoutSuccessPageContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const { user } = useCustomerAuth();
  const orderId = searchParams.get("orderId");
  const trackingLookup = orderId ? `/track-order?orderId=${encodeURIComponent(orderId)}` : "/track-order";

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="page-shell">
      <SiteHeader />
      <FrameStatement
        kicker="Payment received"
        words={["Thank", "you."]}
        frame="mark"
        body={
          user
            ? "Your order is available in your account. We will write when it is packed, and again when it leaves."
            : "Your order is confirmed. Track this order using your order number below, with the email or phone you paid with."
        }
        reference={orderId}
        rows={[
          { label: "Paid", value: "Done", done: true },
          { label: "Confirmed", value: "Done", done: true },
          { label: "Packed", value: "Next" },
          { label: "Shipped", value: "Tracking follows" },
        ]}
        actions={[
          user ? { href: "/account#my-orders", label: "View my order" } : { href: trackingLookup, label: "Track this order" },
          user ? { href: trackingLookup, label: "Track this order" } : { href: "/account", label: "Create a wardrobe" },
          { href: "/shop", label: "Continue shopping" },
        ]}
      />
      <SiteFooter />
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutSuccessPageContent />
    </Suspense>
  );
}
