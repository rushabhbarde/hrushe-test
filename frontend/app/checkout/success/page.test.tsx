import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({
  user: null as null | { id: string; role: string; name: string; email: string },
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("orderId=42"),
}));

vi.mock("@/components/cart-provider", () => ({
  useCart: () => ({
    clearCart: vi.fn(),
  }),
}));

vi.mock("@/components/customer-auth-provider", () => ({
  useCustomerAuth: () => ({
    user: authState.user,
  }),
}));

vi.mock("@/components/site-header", () => ({
  SiteHeader: () => <header>Header</header>,
}));

vi.mock("@/components/site-footer", () => ({
  SiteFooter: () => <footer>Footer</footer>,
}));

import CheckoutSuccessPage from "@/app/checkout/success/page";

describe("checkout success page copy", () => {
  beforeEach(() => {
    authState.user = null;
  });

  it("does not claim guest orders were added to an account", () => {
    render(<CheckoutSuccessPage />);

    expect(screen.getByText(/track this order using your order number/i)).toBeInTheDocument();
    expect(screen.queryByText(/added to your account/i)).not.toBeInTheDocument();
  });

  it("describes account availability for signed-in customers", () => {
    authState.user = {
      id: "customer-1",
      role: "customer",
      name: "Aarav Mehta",
      email: "customer@example.com",
    };

    render(<CheckoutSuccessPage />);

    expect(screen.getByText(/order is available in your account/i)).toBeInTheDocument();
  });
});
