"use client";

import { usePathname } from "next/navigation";
import { useAuthModal } from "@/components/auth-modal-provider";
import { useCustomerAuth } from "@/components/customer-auth-provider";
import { useToast } from "@/components/toast-provider";
import { useWishlist } from "@/components/wishlist-provider";

export function WishlistButton({
  productId,
  label,
  className = "",
  iconClassName = "",
}: {
  productId: string;
  label: string;
  className?: string;
  iconClassName?: string;
}) {
  const pathname = usePathname();
  const { isAuthenticated } = useCustomerAuth();
  const { openLogin } = useAuthModal();
  const { pushToast } = useToast();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const active = isWishlisted(productId);

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={() => {
        if (!isAuthenticated) {
          openLogin(pathname);
          return;
        }

        toggleWishlist(productId);
        pushToast(
          active
            ? "Removed from favourites."
            : "Added to favourites. Ready whenever you are."
        );
      }}
      className={className}
    >
      <svg
        viewBox="0 0 24 24"
        className={iconClassName || "h-5 w-5"}
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
      </svg>
    </button>
  );
}
