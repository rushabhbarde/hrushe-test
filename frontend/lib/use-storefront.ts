"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product, ProductReview } from "@/lib/catalog";
import {
  defaultHomepageBanner,
  type HomepageBanner,
} from "@/lib/storefront-data";
import { apiRequest } from "@/lib/api";
import { getAdminAuthHeaders } from "@/lib/admin-auth";
import { isPersistedMediaSource } from "@/lib/image-source";

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

let productCache: ProductCache | null = null;
let productRequest: Promise<ProductCache> | null = null;
let adminProductCache: ProductCache | null = null;
let adminProductRequest: Promise<ProductCache> | null = null;
let bannerCache: BannerCache | null = null;
let bannerRequest: Promise<BannerCache> | null = null;

function mergeProductsWithDefaults(products: Product[]) {
  return products.map((product) => ({
    ...product,
    name: product.displayName || product.name || "",
    slug: (product.slug || product.id).replace(/begie/gi, "beige"),
    description: product.description || "",
    category: product.category || "",
    categories: Array.isArray(product.categories) ? product.categories : [],
    colors: Array.isArray(product.colors)
      ? product.colors
      : product.colour
        ? [product.colour]
        : [],
    sizes: Array.isArray(product.sizes) ? product.sizes : [],
    images: Array.isArray(product.images)
      ? product.images.filter(isPersistedMediaSource)
      : product.thumbnailUrl
        ? [product.thumbnailUrl].filter(isPersistedMediaSource)
        : [],
    galleryImages: Array.isArray(product.galleryImages)
      ? product.galleryImages.filter(isPersistedMediaSource)
      : [],
    videos: Array.isArray(product.videos)
      ? product.videos.filter((video) => isPersistedMediaSource(video.url))
      : [],
    reviews: Array.isArray(product.reviews) ? product.reviews : [],
    imageLabel: product.imageLabel || product.displayName || product.name || "Product",
    accent: product.accent || "#eeece6",
    status: product.status || (product.availability === "sold-out" ? "Sold Out" : "Active"),
    trackInventory: Boolean(product.trackInventory),
    variants: Array.isArray(product.variants) ? product.variants : [],
  }));
}

async function fetchProducts(admin = false) {
  const pendingRequest = admin ? adminProductRequest : productRequest;

  if (!pendingRequest) {
    const request = apiRequest<Product[]>(admin ? "/products?admin=true" : "/products", {
      cache: "no-store",
    })
      .then((productsData) => {
        const nextCache = {
          products: mergeProductsWithDefaults(productsData),
          timestamp: Date.now(),
        };
        if (admin) adminProductCache = nextCache;
        else productCache = nextCache;
        return nextCache;
      })
      .finally(() => {
        if (admin) adminProductRequest = null;
        else productRequest = null;
      });
    if (admin) adminProductRequest = request;
    else productRequest = request;
  }

  return (admin ? adminProductRequest : productRequest) as Promise<ProductCache>;
}

async function fetchHomepageBanner() {
  if (!bannerRequest) {
    bannerRequest = apiRequest<HomepageBanner>("/content/homepage", {
      cache: "no-store",
    })
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

export function useStorefrontData({ admin = false }: { admin?: boolean } = {}) {
  const initialCache = admin ? adminProductCache : productCache;
  const [products, setProducts] = useState<Product[]>(
    initialCache?.products || []
  );
  const [loading, setLoading] = useState(!initialCache);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await fetchProducts(admin);

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
  }, [admin]);

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
      const nextCache = {
        products: next,
        timestamp: Date.now(),
      };
      if (admin) adminProductCache = nextCache;
      else productCache = nextCache;
      return next;
    });
    productCache = null;
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
      const nextCache = {
        products: next,
        timestamp: Date.now(),
      };
      if (admin) adminProductCache = nextCache;
      else productCache = nextCache;
      return next;
    });
    productCache = null;

    return updated;
  };

  const deleteProduct = async (productId: string) => {
    await apiRequest(`/products/${productId}`, {
      method: "DELETE",
      headers: getAdminAuthHeaders(),
    });

    setProducts((current) => {
      const next = current.filter((product) => product.id !== productId);
      const nextCache = {
        products: next,
        timestamp: Date.now(),
      };
      if (admin) adminProductCache = nextCache;
      else productCache = nextCache;
      return next;
    });
    productCache = null;
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
      const nextCache = { products: next, timestamp: Date.now() };
      if (admin) adminProductCache = nextCache;
      else productCache = nextCache;
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
