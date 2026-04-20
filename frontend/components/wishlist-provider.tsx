"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiRequest } from "@/lib/api";
import { useCustomerAuth } from "@/components/customer-auth-provider";
import type { WishlistProduct } from "@/lib/account";

type WishlistContextValue = {
  wishlistIds: string[];
  itemCount: number;
  isWishlistOpen: boolean;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => boolean;
  removeWishlistItem: (productId: string) => void;
  openWishlist: () => void;
  closeWishlist: () => void;
  refreshWishlist: () => Promise<void>;
};

const GUEST_WISHLIST_KEY = "hrushetest-wishlist-guest";

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

function readWishlist(key: string) {
  if (typeof window === "undefined") {
    return [] as string[];
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function writeWishlist(key: string, value: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Keep wishlist working even if storage is blocked.
  }
}

type WishlistResponse = {
  products: WishlistProduct[];
};

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isChecking } = useCustomerAuth();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  const storageKey = user?.id
    ? `hrushetest-wishlist-${user.id}`
    : GUEST_WISHLIST_KEY;

  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      const nextIds = readWishlist(storageKey);
      setWishlistIds(nextIds);
      return;
    }

    try {
      const response = await apiRequest<WishlistResponse>("/account/wishlist", {
        cache: "no-store",
      });
      const nextIds = response.products.map((product) => product.id);
      setWishlistIds(nextIds);
      writeWishlist(storageKey, nextIds);
    } catch {
      // Keep existing wishlist state.
    }
  }, [isAuthenticated, storageKey]);

  useEffect(() => {
    if (isChecking) {
      return;
    }

    let cancelled = false;

    const syncWishlist = async () => {
      if (!isAuthenticated || !user?.id) {
        const guestIds = readWishlist(GUEST_WISHLIST_KEY);
        if (!cancelled) {
          setWishlistIds(guestIds);
        }
        return;
      }

      const guestIds = readWishlist(GUEST_WISHLIST_KEY);

      try {
        if (guestIds.length > 0) {
          await Promise.all(
            guestIds.map((productId) =>
              apiRequest(`/account/wishlist/${productId}`, {
                method: "POST",
              }).catch(() => null)
            )
          );
          window.localStorage.removeItem(GUEST_WISHLIST_KEY);
        }

        const response = await apiRequest<WishlistResponse>("/account/wishlist", {
          cache: "no-store",
        });

        if (!cancelled) {
          const nextIds = response.products.map((product) => product.id);
          setWishlistIds(nextIds);
          writeWishlist(storageKey, nextIds);
        }
      } catch {
        if (!cancelled) {
          setWishlistIds(guestIds);
        }
      }
    };

    void syncWishlist();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isChecking, storageKey, user?.id]);

  useEffect(() => {
    writeWishlist(storageKey, wishlistIds);
  }, [storageKey, wishlistIds]);

  const isWishlisted = useCallback(
    (productId: string) => wishlistIds.includes(productId),
    [wishlistIds]
  );

  const openWishlist = useCallback(() => setIsWishlistOpen(true), []);
  const closeWishlist = useCallback(() => setIsWishlistOpen(false), []);

  const toggleWishlist = useCallback(
    (productId: string) => {
      const currentlyWishlisted = wishlistIds.includes(productId);
      const nextActive = !currentlyWishlisted;

      setWishlistIds((current) =>
        current.includes(productId)
          ? current.filter((id) => id !== productId)
          : [productId, ...current]
      );

      if (isAuthenticated) {
        void apiRequest(`/account/wishlist/${productId}`, {
          method: currentlyWishlisted ? "DELETE" : "POST",
        }).catch(() => {
          void refreshWishlist();
        });
      }

      return nextActive;
    },
    [isAuthenticated, refreshWishlist, wishlistIds]
  );

  const removeWishlistItem = useCallback(
    (productId: string) => {
      setWishlistIds((current) => current.filter((id) => id !== productId));

      if (isAuthenticated) {
        void apiRequest(`/account/wishlist/${productId}`, {
          method: "DELETE",
        }).catch(() => {
          void refreshWishlist();
        });
      }
    },
    [isAuthenticated, refreshWishlist]
  );

  const value = useMemo(
    () => ({
      wishlistIds,
      itemCount: wishlistIds.length,
      isWishlistOpen,
      isWishlisted,
      toggleWishlist,
      removeWishlistItem,
      openWishlist,
      closeWishlist,
      refreshWishlist,
    }),
    [
      closeWishlist,
      isWishlistOpen,
      isWishlisted,
      openWishlist,
      refreshWishlist,
      removeWishlistItem,
      toggleWishlist,
      wishlistIds,
    ]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }

  return context;
}
