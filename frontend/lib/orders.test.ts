import { describe, expect, it } from "vitest";
import { canTransitionOrderStatus, requiresPaidOrderStatus } from "@/lib/orders";

describe("order lifecycle helpers", () => {
  it("allows forward fulfillment moves and valid returns", () => {
    expect(canTransitionOrderStatus("Pending", "Confirmed")).toBe(true);
    expect(canTransitionOrderStatus("Confirmed", "Packed")).toBe(true);
    expect(canTransitionOrderStatus("Delivered", "Returned")).toBe(true);
  });

  it("blocks backward, terminal, and unsupported cancellation moves", () => {
    expect(canTransitionOrderStatus("Delivered", "Confirmed")).toBe(false);
    expect(canTransitionOrderStatus("Cancelled", "Shipped")).toBe(false);
    expect(canTransitionOrderStatus("Delivered", "Cancelled")).toBe(false);
  });

  it("marks fulfillment states that require a paid order", () => {
    expect(requiresPaidOrderStatus("Pending")).toBe(false);
    expect(requiresPaidOrderStatus("Confirmed")).toBe(true);
    expect(requiresPaidOrderStatus("Cancelled")).toBe(false);
  });
});
