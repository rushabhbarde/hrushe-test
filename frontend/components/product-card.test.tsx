import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Product } from "@/lib/catalog";

vi.mock("@/components/wishlist-button", () => ({
  WishlistButton: ({ label }: { label: string }) => <button type="button">{label}</button>,
}));

vi.mock("@/components/product-quick-add", () => ({
  ProductQuickAdd: ({ product }: { product: Product }) => (
    <button type="button">Quick add {product.name}</button>
  ),
}));

import { ProductCard } from "@/components/product-card";

function buildProduct(patch: Partial<Product> = {}): Product {
  return {
    id: "p1",
    name: "Quiet Tee",
    description: "",
    price: 1299,
    category: "T-Shirts",
    colors: ["Black"],
    sizes: ["S", "M"],
    imageLabel: "Quiet Tee",
    accent: "#111111",
    images: ["/uploads/products/quiet-tee.png"],
    availability: "available",
    status: "Active",
    ...patch,
  };
}

describe("ProductCard", () => {
  it("renders product image, title, price, and add-to-cart affordance", () => {
    render(<ProductCard product={buildProduct()} />);

    expect(screen.getByAltText("Quiet Tee")).toHaveAttribute("src", "/uploads/products/quiet-tee.png");
    expect(screen.getByText("Quiet Tee")).toBeInTheDocument();
    expect(screen.getByText("₹1,299")).toBeInTheDocument();
    expect(screen.getByText("Quick add Quiet Tee")).toBeInTheDocument();
  });

  it("renders a product image fallback when media is missing", () => {
    render(<ProductCard product={buildProduct({ images: [], thumbnailUrl: "" })} />);

    expect(screen.getByText("Image being prepared")).toBeInTheDocument();
  });

  it("shows out-of-stock state", () => {
    render(<ProductCard product={buildProduct({ availability: "sold-out", status: "Sold Out" })} />);

    expect(screen.getByText("Currently unavailable")).toBeInTheDocument();
  });
});
