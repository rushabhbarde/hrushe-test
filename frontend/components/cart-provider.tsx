"use client";

import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { apiRequest } from "@/lib/api";
import { useCustomerAuth } from "@/components/customer-auth-provider";

const GUEST_CART_STORAGE_KEY = "hrushetest-cart-guest";

function readStoredCart(key: string) {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(key);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored) as CartLine[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredCart(key: string, items: CartLine[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Keep cart usable even if storage is unavailable.
  }
}

type ServerCartResponse = {
  id?: string;
  items: CartLine[];
  updatedAt?: string;
};

export type CartLine = {
  productId: string;
  name: string;
  price: number;
  size: string;
  color: string;
  fit?: string;
  quantity: number;
  accent: string;
  image?: string;
};

export type AddCartItemInput = {
  productId: string;
  name: string;
  price: number;
  size?: string;
  color?: string;
  fit?: string;
  quantity?: number;
  accent: string;
  image?: string;
};

type CartContextValue = {
  items: CartLine[];
  itemCount: number;
  subtotal: number;
  isCartOpen: boolean;
  addItem: (item: AddCartItemInput) => void;
  removeItem: (productId: string, size?: string, color?: string, fit?: string) => void;
  updateQuantity: (
    productId: string,
    size: string,
    color: string,
    quantity: number,
    fit?: string
  ) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  refreshCart: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

const sameVariant = (
  item: Pick<CartLine, "productId" | "size" | "color" | "fit">,
  target: Pick<CartLine, "productId" | "size" | "color" | "fit">
) =>
  item.productId === target.productId &&
  item.size === target.size &&
  item.color === target.color &&
  (item.fit || "") === (target.fit || "");

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isChecking } = useCustomerAuth();
  const storageKey = user?.id ? `hrushetest-cart-${user.id}` : GUEST_CART_STORAGE_KEY;
  const [items, setItems] = useState<CartLine[]>(() => readStoredCart(GUEST_CART_STORAGE_KEY));
  const [isCartOpen, setIsCartOpen] = useState(false);
  const isSyncingRef = useRef(false);
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const refreshServerCart = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    try {
      const response = await apiRequest<ServerCartResponse>("/cart", {
        cache: "no-store",
      });
      setItems(response.items || []);
      writeStoredCart(storageKey, response.items || []);
    } catch {
      // Keep the current cart visible if sync fails.
    }
  }, [isAuthenticated, storageKey]);

  useEffect(() => {
    if (isChecking || isSyncingRef.current) {
      return;
    }

    if (!isAuthenticated || !user?.id) {
      const guestItems = readStoredCart(GUEST_CART_STORAGE_KEY);
      setItems(guestItems);
      return;
    }

    let cancelled = false;
    isSyncingRef.current = true;

    const syncCart = async () => {
      const guestItems = readStoredCart(GUEST_CART_STORAGE_KEY);

      try {
        const response = guestItems.length
          ? await apiRequest<ServerCartResponse>("/cart/sync", {
              method: "POST",
              body: JSON.stringify({ items: guestItems }),
            })
          : await apiRequest<ServerCartResponse>("/cart", {
              cache: "no-store",
            });

        if (!cancelled) {
          setItems(response.items || []);
          writeStoredCart(storageKey, response.items || []);
          writeStoredCart(GUEST_CART_STORAGE_KEY, []);
        }
      } catch {
        if (!cancelled) {
          const cachedUserItems = readStoredCart(storageKey);
          setItems(cachedUserItems.length ? cachedUserItems : guestItems);
        }
      } finally {
        isSyncingRef.current = false;
      }
    };

    void syncCart();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isChecking, storageKey, user?.id]);

  useEffect(() => {
    writeStoredCart(storageKey, items);
  }, [items, storageKey]);

  const addItem = useCallback(
    ({
      productId,
      name,
      price,
      size = "",
      color = "",
      fit = "",
      quantity = 1,
      accent,
      image,
    }: AddCartItemInput) => {
      const nextLine: CartLine = {
        productId,
        name,
        price,
        size,
        color,
        fit,
        quantity,
        accent,
        image,
      };

      setItems((current) => {
        const existing = current.find((item) => sameVariant(item, nextLine));

        if (existing) {
          return current.map((item) =>
            sameVariant(item, nextLine)
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }

        return [...current, nextLine];
      });

      if (isAuthenticated) {
        void apiRequest<ServerCartResponse>("/cart/add", {
          method: "POST",
          body: JSON.stringify({
            productId,
            quantity,
            size,
            color,
            fit,
          }),
        }).then((response) => {
          setItems(response.items || []);
        }).catch(() => {
          void refreshServerCart();
        });
      }
    },
    [isAuthenticated, refreshServerCart]
  );

  const removeItem = useCallback(
    (productId: string, size = "", color = "", fit = "") => {
      setItems((current) =>
        current.filter(
          (item) =>
            !sameVariant(item, {
              productId,
              size,
              color,
              fit,
            })
        )
      );

      if (isAuthenticated) {
        void apiRequest<ServerCartResponse>("/cart/remove", {
          method: "DELETE",
          body: JSON.stringify({ productId, size, color, fit }),
        }).then((response) => {
          setItems(response.items || []);
        }).catch(() => {
          void refreshServerCart();
        });
      }
    },
    [isAuthenticated, refreshServerCart]
  );

  const updateQuantity = useCallback(
    (productId: string, size: string, color: string, quantity: number, fit = "") => {
      if (quantity <= 0) {
        removeItem(productId, size, color, fit);
        return;
      }

      setItems((current) =>
        current.map((item) =>
          sameVariant(item, { productId, size, color, fit })
            ? { ...item, quantity }
            : item
        )
      );

      if (isAuthenticated) {
        void apiRequest<ServerCartResponse>("/cart/item", {
          method: "PUT",
          body: JSON.stringify({ productId, size, color, fit, quantity }),
        }).then((response) => {
          setItems(response.items || []);
        }).catch(() => {
          void refreshServerCart();
        });
      }
    },
    [isAuthenticated, refreshServerCart, removeItem]
  );

  const clearCart = useCallback(() => {
    setItems([]);
    writeStoredCart(storageKey, []);
    if (isAuthenticated) {
      void refreshServerCart();
    }
  }, [isAuthenticated, refreshServerCart, storageKey]);

  const value = useMemo(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return {
      items,
      itemCount,
      subtotal,
      isCartOpen,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      openCart,
      closeCart,
      refreshCart: refreshServerCart,
    };
  }, [
    addItem,
    clearCart,
    closeCart,
    isCartOpen,
    items,
    openCart,
    refreshServerCart,
    removeItem,
    updateQuantity,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
}
