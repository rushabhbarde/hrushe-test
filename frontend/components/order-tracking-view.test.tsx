import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrderTrackingView } from "@/components/order-tracking-view";
import { activeFulfillmentStatuses, canTransitionOrderStatus, getOrderStageWord } from "@/lib/orders";

const order = {
  id: "abc",
  orderNumber: 1042,
  paymentStatus: "paid",
  shippingAddress: "12 Example Lane, Pune",
  totalAmount: 599,
  products: [],
  createdAt: "2026-10-10T10:00:00.000Z",
};

describe("order journey", () => {
  it("shows the atelier's word for the stage, not the internal status", () => {
    render(<OrderTrackingView order={{ ...order, orderStatus: "Stitching" }} />);

    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("On the table.");
    expect(screen.queryByText("Stitching")).toBeNull();
    const steps = screen.getAllByRole("listitem").map((item) => item.textContent);
    expect(steps).toEqual(["Placed", "Received", "On the table", "Inspected", "Wrapped", "On its way", "Nearly home", "Home"]);
    expect(screen.getByText("On the table", { selector: "li span" }).closest("li")?.getAttribute("aria-current")).toBe("step");
  });

  it("moves forward through stitching and inspection, never back", () => {
    expect(activeFulfillmentStatuses.map(getOrderStageWord)).toContain("Inspected");
    expect(canTransitionOrderStatus("Confirmed", "Stitching")).toBe(true);
    expect(canTransitionOrderStatus("Stitching", "Quality check")).toBe(true);
    expect(canTransitionOrderStatus("Quality check", "Stitching")).toBe(false);
    expect(canTransitionOrderStatus("Quality check", "Cancelled")).toBe(true);
    expect(canTransitionOrderStatus("Shipped", "Cancelled")).toBe(false);
  });
});
