import { describe, expect, it } from "vitest";
import { resolveCheckoutSuccessPath } from "@/lib/checkout-redirect";

describe("checkout success redirect", () => {
  it("keeps verified backend redirects on the visible site origin", () => {
    expect(
      resolveCheckoutSuccessPath(
        "https://api.example.com/checkout/success?orderId=123",
        "https://hrushe.in",
        "fallback"
      )
    ).toBe("/checkout/success?orderId=123");
  });

  it("falls back to the created order when the redirect target is not success", () => {
    expect(
      resolveCheckoutSuccessPath(
        "https://api.example.com/checkout/failure?orderId=123",
        "https://hrushe.in",
        "order 123"
      )
    ).toBe("/checkout/success?orderId=order%20123");
  });
});
