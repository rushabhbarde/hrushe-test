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
            ? "Removed from saved."
            : "Saved. Ready whenever you are."
        );
      }}
      className={className}
    >
      <svg
        viewBox="0 0 24 24"
        className={iconClassName || "h-5 w-5"}
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.9"
      >
        <path d="M7 4.5h10a1.5 1.5 0 0 1 1.5 1.5v13.6L12 15.5l-6.5 4.1V6A1.5 1.5 0 0 1 7 4.5Z" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
