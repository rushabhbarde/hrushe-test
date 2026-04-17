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
type StorefrontCache = {
  products: Product[];
  homepageBanner: HomepageBanner;
  timestamp: number;
};

const STOREFRONT_CACHE_TTL = 60_000;
let storefrontCache: StorefrontCache | null = null;
let storefrontRequest: Promise<StorefrontCache> | null = null;

function mergeProductsWithDefaults(products: Product[]) {
  return products;
}

function isStorefrontCacheFresh() {
  return (
    storefrontCache &&
    Date.now() - storefrontCache.timestamp < STOREFRONT_CACHE_TTL
  );
}

async function fetchStorefrontData() {
  if (isStorefrontCacheFresh()) {
    return storefrontCache as StorefrontCache;
  }

  if (!storefrontRequest) {
    storefrontRequest = Promise.all([
      apiRequest<Product[]>("/products"),
      apiRequest<HomepageBanner>("/content/homepage"),
    ])
      .then(([productsData, bannerData]) => {
        storefrontCache = {
          products: mergeProductsWithDefaults(productsData),
          homepageBanner: bannerData,
          timestamp: Date.now(),
        };

        return storefrontCache;
      })
      .finally(() => {
        storefrontRequest = null;
      });
  }

  return storefrontRequest;
}

export function useStorefrontData() {
  const [products, setProducts] = useState<Product[]>(
    storefrontCache?.products || []
  );
  const [homepageBanner, setHomepageBannerState] = useState<HomepageBanner>(
    storefrontCache?.homepageBanner || defaultHomepageBanner
  );
  const [loading, setLoading] = useState(!storefrontCache);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await fetchStorefrontData();

        if (!active) {
          return;
        }

        setProducts(data.products);
        setHomepageBannerState(data.homepageBanner);
      } catch {
        if (!active) {
          return;
        }

        setProducts([]);
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

    setProducts((current) => {
      const next = [created, ...current];
      storefrontCache = {
        products: next,
        homepageBanner,
        timestamp: Date.now(),
      };
      return next;
    });
    return created;
  };

  const updateProduct = async (productId: string, product: Product) => {
    const updated = await apiRequest<Product>(`/products/${productId}`, {
      method: "PUT",
      body: JSON.stringify(product),
      headers: getAdminAuthHeaders(),
    });

    setProducts((current) => {
      const next = current.map((item) => (item.id === productId ? updated : item));
      storefrontCache = {
        products: next,
        homepageBanner,
        timestamp: Date.now(),
      };
      return next;
    });

    return updated;
  };

  const deleteProduct = async (productId: string) => {
    await apiRequest(`/products/${productId}`, {
      method: "DELETE",
      headers: getAdminAuthHeaders(),
    });

    setProducts((current) => {
      const next = current.filter((product) => product.id !== productId);
      storefrontCache = {
        products: next,
        homepageBanner,
        timestamp: Date.now(),
      };
      return next;
    });
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

      setProducts((current) => {
        const next = current.map((item) => (item.id === productId ? updated : item));
        storefrontCache = {
          products: next,
          homepageBanner,
          timestamp: Date.now(),
        };
        return next;
      });

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

      setProducts((current) => {
        const next = current.map((item) => {
          if (item.id !== productId) {
            return item;
          }

          fallbackProduct = {
            ...item,
            reviews: [fallbackUpdatedReview, ...(item.reviews || [])],
          };

          return fallbackProduct;
        });

        storefrontCache = {
          products: next,
          homepageBanner,
          timestamp: Date.now(),
        };

        return next;
      });

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
    storefrontCache = {
      products,
      homepageBanner: updated,
      timestamp: Date.now(),
    };
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
