import { describe, expect, it } from "vitest";
import { isWithinReturnWindow } from "@/components/order-actions";
import { canCustomerCancelOrder } from "@/lib/orders";
import { formatGsm } from "@/lib/product-presentation";

const DAY = 24 * 60 * 60 * 1000;

describe("what a customer can do with an order", () => {
  it("can cancel until it ships, not after", () => {
    expect(["Pending", "Confirmed", "Preparing", "Quality check", "Packed"].map((s) => canCustomerCancelOrder(s as never))).toEqual([
      true,
      true,
      true,
      true,
      true,
    ]);
    expect(["Shipped", "Out for delivery", "Delivered", "Cancelled"].map((s) => canCustomerCancelOrder(s as never))).toEqual([
      false,
      false,
      false,
      false,
    ]);
  });

  it("can return or exchange for 7 days after delivery", () => {
    const now = Date.parse("2026-10-20T12:00:00Z");
    expect(isWithinReturnWindow({ orderStatus: "Delivered", updatedAt: new Date(now - 6 * DAY).toISOString() }, now)).toBe(true);
    expect(isWithinReturnWindow({ orderStatus: "Delivered", updatedAt: new Date(now - 8 * DAY).toISOString() }, now)).toBe(false);
    expect(isWithinReturnWindow({ orderStatus: "Shipped", updatedAt: new Date(now).toISOString() }, now)).toBe(false);
    // The recorded delivery date wins over a later edit to the order.
    expect(
      isWithinReturnWindow(
        { orderStatus: "Delivered", deliveredAt: new Date(now - 9 * DAY).toISOString(), updatedAt: new Date(now).toISOString() },
        now
      )
    ).toBe(false);
  });
});

describe("formatGsm", () => {
  it("adds the unit once", () => {
    expect(formatGsm("240")).toBe("240 GSM");
    expect(formatGsm("240 gsm")).toBe("240 gsm");
    expect(formatGsm("")).toBe("");
  });
});
