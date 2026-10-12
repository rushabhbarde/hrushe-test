/**
 * Shop events for Google Analytics and Meta Pixel. The tags themselves load only when an
 * ID is configured and the visitor has agreed (components/consent-controlled-tracking.tsx),
 * so without either of those every call here does nothing.
 */

type TrackingWindow = Window & {
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
};

export type TrackedItem = { productId: string; name: string; price: number; quantity?: number; size?: string };

type ShopEvent = "add_to_cart" | "begin_checkout" | "purchase";

const metaEventNames: Record<ShopEvent, string> = {
  add_to_cart: "AddToCart",
  begin_checkout: "InitiateCheckout",
  purchase: "Purchase",
};

export function trackShopEvent(event: ShopEvent, items: TrackedItem[], options: { orderId?: string } = {}) {
  if (typeof window === "undefined" || items.length === 0) {
    return;
  }

  const trackingWindow = window as TrackingWindow;
  const value = items.reduce((total, item) => total + item.price * (item.quantity || 1), 0);

  trackingWindow.gtag?.("event", event, {
    currency: "INR",
    value,
    ...(options.orderId ? { transaction_id: options.orderId } : {}),
    items: items.map((item) => ({
      item_id: item.productId,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity || 1,
      ...(item.size ? { item_variant: item.size } : {}),
    })),
  });

  trackingWindow.fbq?.("track", metaEventNames[event], {
    currency: "INR",
    value,
    content_type: "product",
    content_ids: items.map((item) => item.productId),
    num_items: items.reduce((total, item) => total + (item.quantity || 1), 0),
  });
}
