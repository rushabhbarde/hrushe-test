"use client";

import { useState } from "react";
import { useCart, type AddCartItemInput } from "@/components/cart-provider";
import { useToast } from "@/components/toast-provider";

export function AddToCartButton({
  item,
  disabled = false,
  validationMessage,
}: {
  item: AddCartItemInput;
  disabled?: boolean;
  validationMessage?: string;
}) {
  const { addItem, openCart } = useCart();
  const { pushToast } = useToast();
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  const handleClick = () => {
    if (disabled) {
      const message = validationMessage || "Please complete your selection.";
      setError(message);
      pushToast(message, "error");
      return;
    }

    addItem(item);
    setError("");
    setAdded(true);
    pushToast(`${item.name} added to cart`);
    openCart();
    window.setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className="button-primary rounded-full px-5 py-3 transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {added ? "Added" : "Add to cart"}
      </button>
      {error ? <p className="text-sm text-[var(--accent)]">{error}</p> : null}
    </div>
  );
}
