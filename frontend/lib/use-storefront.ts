"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product, ProductReview } from "@/lib/catalog";
import {
  defaultHomepageBanner,
  defaultProducts,
  type HomepageBanner,
} from "@/lib/storefront-data";
import { apiRequest } from "@/lib/api";
import { getAdminAuthHeaders } from "@/lib/admin-auth";

type HomepageBannerPayload = Partial<HomepageBanner>;
type ProductReviewPayload = Omit<ProductReview, "id" | "createdAt">;

function mergeProductsWithDefaults(products: Product[]) {
  if (products.length === 0) {
    return defaultProducts;
  }

  return products;
}

export function useStorefrontData() {
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [homepageBanner, setHomepageBannerState] =
    useState<HomepageBanner>(defaultHomepageBanner);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [productsData, bannerData] = await Promise.all([
          apiRequest<Product[]>("/products"),
          apiRequest<HomepageBanner>("/content/homepage"),
        ]);

        if (!active) {
          return;
        }

        setProducts(mergeProductsWithDefaults(productsData));
        setHomepageBannerState(bannerData);
      } catch {
        if (!active) {
          return;
        }

        setProducts(defaultProducts);
        setHomepageBannerState(defaultHomepageBanner);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const featuredProducts = useMemo(
    () => products.filter((product) => product.featured),
    [products]
  );

  const addProduct = async (product: Product) => {
    const created = await apiRequest<Product>("/products", {
      method: "POST",
      body: JSON.stringify(product),
      headers: getAdminAuthHeaders(),
    });

    setProducts((current) => [created, ...current]);
    return created;
  };

  const updateProduct = async (productId: string, product: Product) => {
    const updated = await apiRequest<Product>(`/products/${productId}`, {
      method: "PUT",
      body: JSON.stringify(product),
      headers: getAdminAuthHeaders(),
    });

    setProducts((current) =>
      current.map((item) => (item.id === productId ? updated : item))
    );

    return updated;
  };

  const deleteProduct = async (productId: string) => {
    await apiRequest(`/products/${productId}`, {
      method: "DELETE",
      headers: getAdminAuthHeaders(),
    });

    setProducts((current) => current.filter((product) => product.id !== productId));
  };

  const addProductReview = async (
    productId: string,
    review: ProductReviewPayload
  ) => {
    try {
      const updated = await apiRequest<Product>(`/products/${productId}/reviews`, {
        method: "POST",
        body: JSON.stringify(review),
      });

      setProducts((current) =>
        current.map((item) => (item.id === productId ? updated : item))
      );

      return updated;
    } catch (error) {
      const fallbackUpdatedReview: ProductReview = {
        ...review,
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}`,
        createdAt: new Date().toISOString(),
      };

      let fallbackProduct: Product | null = null;

      setProducts((current) =>
        current.map((item) => {
          if (item.id !== productId) {
            return item;
          }

          fallbackProduct = {
            ...item,
            reviews: [fallbackUpdatedReview, ...(item.reviews || [])],
          };

          return fallbackProduct;
        })
      );

      if (fallbackProduct) {
        return fallbackProduct;
      }

      throw error;
    }
  };

  const saveHomepageBanner = async (payload: HomepageBannerPayload) => {
    const updated = await apiRequest<HomepageBanner>("/content/homepage", {
      method: "PUT",
      body: JSON.stringify(payload),
      headers: getAdminAuthHeaders(),
    });

    setHomepageBannerState(updated);
    return updated;
  };

  return {
    products,
    featuredProducts,
    homepageBanner,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    addProductReview,
    saveHomepageBanner,
    setHomepageBannerState,
  };
}
