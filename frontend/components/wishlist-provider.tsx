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
import { useCustomerAuth } from "@/components/customer-auth-provider";

type WishlistContextValue = {
  wishlistIds: string[];
  itemCount: number;
  isWishlistOpen: boolean;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => boolean;
  removeWishlistItem: (productId: string) => void;
  openWishlist: () => void;
  closeWishlist: () => void;
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
    // Prevent wishlist storage issues from breaking the UI.
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useCustomerAuth();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  const storageKey = user?.id
    ? `hrushetest-wishlist-${user.id}`
    : GUEST_WISHLIST_KEY;

  useEffect(() => {
    let cancelled = false;
    const syncWishlist = (nextIds: string[]) => {
      window.setTimeout(() => {
        if (!cancelled) {
          setWishlistIds(nextIds);
        }
      }, 0);
    };

    const nextIds = readWishlist(storageKey);

    if (user?.id && typeof window !== "undefined") {
      const guestIds = readWishlist(GUEST_WISHLIST_KEY);
      const mergedIds = Array.from(new Set([...guestIds, ...nextIds]));
      syncWishlist(mergedIds);
      writeWishlist(storageKey, mergedIds);

      if (guestIds.length > 0) {
        window.localStorage.removeItem(GUEST_WISHLIST_KEY);
      }
      return () => {
        cancelled = true;
      };
    }

    syncWishlist(nextIds);
    return () => {
      cancelled = true;
    };
  }, [storageKey, user?.id]);

  useEffect(() => {
    writeWishlist(storageKey, wishlistIds);
  }, [storageKey, wishlistIds]);

  const isWishlisted = useCallback(
    (productId: string) => wishlistIds.includes(productId),
    [wishlistIds]
  );

  const openWishlist = useCallback(() => setIsWishlistOpen(true), []);
  const closeWishlist = useCallback(() => setIsWishlistOpen(false), []);

  const toggleWishlist = useCallback((productId: string) => {
    let nextActive = false;

    setWishlistIds((current) => {
      if (current.includes(productId)) {
        nextActive = false;
        return current.filter((id) => id !== productId);
      }

      nextActive = true;
      return [productId, ...current];
    });

    return nextActive;
  }, []);

  const removeWishlistItem = useCallback((productId: string) => {
    setWishlistIds((current) => current.filter((id) => id !== productId));
  }, []);

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
    }),
    [
      closeWishlist,
      isWishlistOpen,
      isWishlisted,
      openWishlist,
      removeWishlistItem,
      wishlistIds,
      toggleWishlist,
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
