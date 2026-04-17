"use client";

import { useEffect, useRef } from "react";
import type { Product } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";

type ProductCardScrollerProps = {
  products: Product[];
};

export function ProductCardScroller({ products }: ProductCardScrollerProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;

    if (!scroller || products.length <= 4) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const card = scroller.querySelector<HTMLElement>("[data-product-card]");

      if (!card) {
        return;
      }

      const computedStyle = window.getComputedStyle(scroller);
      const gap = Number.parseFloat(computedStyle.columnGap || computedStyle.gap || "16");
      const nextLeft = scroller.scrollLeft + card.offsetWidth + gap;
      const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;

      scroller.scrollTo({
        left: nextLeft >= maxScrollLeft - 8 ? 0 : nextLeft,
        behavior: "smooth",
      });
    }, 3200);

    return () => window.clearInterval(intervalId);
  }, [products.length]);

  return (
    <div
      ref={scrollerRef}
      className="product-row-scroll mt-8 flex gap-4 overflow-x-auto pb-3 sm:mt-10 xl:gap-6"
    >
      {products.map((product) => (
        <div
          key={product.id}
          data-product-card
          className="min-w-[260px] flex-[0_0_260px] sm:min-w-[300px] sm:flex-[0_0_300px] xl:min-w-[320px] xl:flex-[0_0_320px]"
        >
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
