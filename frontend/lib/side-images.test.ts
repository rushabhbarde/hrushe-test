import { describe, expect, it } from "vitest";
import { withSideImages, type Product } from "@/lib/catalog";

const piece = (extra: Partial<Product>) =>
  ({ id: "p1", name: "Tee", images: ["/men-default.jpg"], colors: [], sizes: [], price: 1, ...extra }) as Product;

describe("withSideImages", () => {
  it("uses the side's own photo set when there is one", () => {
    const [women] = withSideImages([piece({ womenImages: ["/women.jpg"] })], "Women");
    expect(women.images).toEqual(["/women.jpg"]);
    expect(women.thumbnailUrl).toBe("/women.jpg");
  });

  it("keeps the default photos when the side has none", () => {
    const [men] = withSideImages([piece({ womenImages: ["/women.jpg"] })], "Men");
    expect(men.images).toEqual(["/men-default.jpg"]);
  });
});
