"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { useCustomerAuth } from "@/components/customer-auth-provider";
import { FrameStatement } from "@/components/frame-statement";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { trackShopEvent } from "@/lib/tracking";

function CheckoutSuccessPageContent() {
  const searchParams = useSearchParams();
  const { clearCart, items, isReady } = useCart();
  const purchaseTracked = useRef(false);
  const { user } = useCustomerAuth();
  const orderId = searchParams.get("orderId");
  const trackingLookup = orderId ? `/track-order?orderId=${encodeURIComponent(orderId)}` : "/track-order";

  useEffect(() => {
    if (!isReady || purchaseTracked.current) {
      return;
    }
    // Report the purchase once, from the bag as it was paid for, then empty the bag.
    purchaseTracked.current = true;
    trackShopEvent("purchase", items, { orderId: orderId || undefined });
    clearCart();
  }, [clearCart, isReady, items, orderId]);

  return (
    <div className="page-shell">
      <SiteHeader />
      <FrameStatement
        kicker="Payment received"
        words={["Thank", "you."]}
        frame="mark"
        body={
          user
            ? "Your order is available in your account. Each piece is made to order: we will write when it is wrapped, and again when it leaves."
            : "Your order is with the atelier, where each piece is made to order. Track this order using your order number below, with the email or phone you paid with."
        }
        reference={orderId}
        rows={[
          { label: "Received", value: "Done", done: true },
          { label: "On the table", value: "Stitching starts next" },
          { label: "Inspected", value: "Checked by hand" },
          { label: "Wrapped", value: "Then it leaves" },
          { label: "On its way", value: "Tracking follows" },
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
