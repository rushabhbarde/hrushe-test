import { afterEach, describe, expect, it, vi } from "vitest";
import { trackShopEvent } from "@/lib/tracking";

type TrackingWindow = Window & { gtag?: unknown; fbq?: unknown };

describe("trackShopEvent", () => {
  afterEach(() => {
    delete (window as TrackingWindow).gtag;
    delete (window as TrackingWindow).fbq;
  });

  it("does nothing when no tag has loaded", () => {
    expect(() => trackShopEvent("add_to_cart", [{ productId: "p1", name: "Tee", price: 599 }])).not.toThrow();
  });

  it("sends a purchase with value, currency and order number to both tags", () => {
    const gtag = vi.fn();
    const fbq = vi.fn();
    Object.assign(window, { gtag, fbq });

    trackShopEvent(
      "purchase",
      [
        { productId: "p1", name: "Olive Grove Tee", price: 599, quantity: 2, size: "M" },
        { productId: "p2", name: "Desert Oat Tee", price: 599 },
      ],
      { orderId: "HR-1042" }
    );

    expect(gtag).toHaveBeenCalledWith(
      "event",
      "purchase",
      expect.objectContaining({ currency: "INR", value: 1797, transaction_id: "HR-1042" })
    );
    expect(fbq).toHaveBeenCalledWith(
      "track",
      "Purchase",
      expect.objectContaining({ currency: "INR", value: 1797, content_ids: ["p1", "p2"], num_items: 3 })
    );
  });
});
