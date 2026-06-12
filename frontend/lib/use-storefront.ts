"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product, ProductReview } from "@/lib/catalog";
import {
  defaultHomepageBanner,
  type HomepageBanner,
} from "@/lib/storefront-data";
import { apiRequest } from "@/lib/api";
import { getAdminAuthHeaders } from "@/lib/admin-auth";

type HomepageBannerPayload = Partial<HomepageBanner>;
type ProductReviewPayload = Omit<ProductReview, "id" | "createdAt">;
type ProductCache = {
  products: Product[];
  timestamp: number;
};
type BannerCache = {
  homepageBanner: HomepageBanner;
  timestamp: number;
};

const STOREFRONT_CACHE_TTL = 60_000;
let productCache: ProductCache | null = null;
let productRequest: Promise<ProductCache> | null = null;
let bannerCache: BannerCache | null = null;
let bannerRequest: Promise<BannerCache> | null = null;

function mergeProductsWithDefaults(products: Product[]) {
  return products;
}

function isCacheFresh(cache: { timestamp: number } | null) {
  return Boolean(cache && Date.now() - cache.timestamp < STOREFRONT_CACHE_TTL);
}

async function fetchProducts() {
  if (isCacheFresh(productCache)) {
    return productCache as ProductCache;
  }

  if (!productRequest) {
    productRequest = apiRequest<Product[]>("/products")
      .then((productsData) => {
        productCache = {
          products: mergeProductsWithDefaults(productsData),
          timestamp: Date.now(),
        };
        return productCache;
      })
      .finally(() => {
        productRequest = null;
      });
  }

  return productRequest;
}

async function fetchHomepageBanner() {
  if (isCacheFresh(bannerCache)) {
    return bannerCache as BannerCache;
  }

  if (!bannerRequest) {
    bannerRequest = apiRequest<HomepageBanner>("/content/homepage")
      .then((homepageBanner) => {
        bannerCache = { homepageBanner, timestamp: Date.now() };
        return bannerCache;
      })
      .finally(() => {
        bannerRequest = null;
      });
  }

  return bannerRequest;
}

export function useStorefrontData() {
  const [products, setProducts] = useState<Product[]>(
    productCache?.products || []
  );
  const [loading, setLoading] = useState(!productCache);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await fetchProducts();

        if (!active) {
          return;
        }

        setProducts(data.products);
      } catch {
        if (!active) {
          return;
        }

        setProducts([]);
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
      productCache = {
        products: next,
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
      productCache = {
        products: next,
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
      productCache = {
        products: next,
        timestamp: Date.now(),
      };
      return next;
    });
  };

  const addProductReview = async (
    productId: string,
    review: ProductReviewPayload
  ) => {
    const updated = await apiRequest<Product>(`/products/${productId}/reviews`, {
      method: "POST",
      body: JSON.stringify(review),
    });

    setProducts((current) => {
      const next = current.map((item) => (item.id === productId ? updated : item));
      productCache = { products: next, timestamp: Date.now() };
      return next;
    });
    return updated;
  };

  return {
    products,
    featuredProducts,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    addProductReview,
  };
}

export function useHomepageBannerData() {
  const [homepageBanner, setHomepageBannerState] = useState<HomepageBanner>(
    bannerCache?.homepageBanner || defaultHomepageBanner
  );
  const [loading, setLoading] = useState(!bannerCache);

  useEffect(() => {
    let active = true;

    fetchHomepageBanner()
      .then((data) => {
        if (active) {
          setHomepageBannerState(data.homepageBanner);
        }
      })
      .catch(() => {
        if (active) {
          setHomepageBannerState(defaultHomepageBanner);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const saveHomepageBanner = async (payload: HomepageBannerPayload) => {
    const updated = await apiRequest<HomepageBanner>("/content/homepage", {
      method: "PUT",
      body: JSON.stringify(payload),
      headers: getAdminAuthHeaders(),
    });

    setHomepageBannerState(updated);
    bannerCache = { homepageBanner: updated, timestamp: Date.now() };
    return updated;
  };

  return {
    homepageBanner,
    loading,
    saveHomepageBanner,
    setHomepageBannerState,
  };
}
