"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/components/admin-auth-provider";
import { useAdminAuthModal } from "@/components/admin-auth-modal-provider";
import { useAuthModal } from "@/components/auth-modal-provider";
import { useCart } from "@/components/cart-provider";
import { useCustomerAuth } from "@/components/customer-auth-provider";
import { useWishlist } from "@/components/wishlist-provider";
import { useStorefrontData } from "@/lib/use-storefront";

const navItems = [
  { href: "/new-in", label: "NEW IN" },
  { href: "/shop", label: "SHOP" },
  { href: "/story", label: "STORY" },
];

function HeaderIcon({
  children,
  href,
  onClick,
  label,
  className,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  label: string;
  className?: string;
}) {
  const baseClassName =
    "flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-black/5 sm:h-11 sm:w-11 lg:h-12 lg:w-12";
  const classes = className ? `${baseClassName} ${className}` : baseClassName;

  if (href) {
    return (
      <Link href={href} aria-label={label} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={classes}
    >
      {children}
    </button>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 -0.5 25 25" className="h-5 w-5 sm:h-5.5 sm:w-5.5 lg:h-6 lg:w-6" fill="none" aria-hidden="true">
      <path
        d="M11.75 9.874C11.75 10.2882 12.0858 10.624 12.5 10.624C12.9142 10.624 13.25 10.2882 13.25 9.874H11.75ZM13.25 4C13.25 3.58579 12.9142 3.25 12.5 3.25C12.0858 3.25 11.75 3.58579 11.75 4H13.25ZM9.81082 6.66156C10.1878 6.48991 10.3542 6.04515 10.1826 5.66818C10.0109 5.29121 9.56615 5.12478 9.18918 5.29644L9.81082 6.66156ZM5.5 12.16L4.7499 12.1561L4.75005 12.1687L5.5 12.16ZM12.5 19L12.5086 18.25C12.5029 18.25 12.4971 18.25 12.4914 18.25L12.5 19ZM19.5 12.16L20.2501 12.1687L20.25 12.1561L19.5 12.16ZM15.8108 5.29644C15.4338 5.12478 14.9891 5.29121 14.8174 5.66818C14.6458 6.04515 14.8122 6.48991 15.1892 6.66156L15.8108 5.29644ZM13.25 9.874V4H11.75V9.874H13.25ZM9.18918 5.29644C6.49843 6.52171 4.7655 9.19951 4.75001 12.1561L6.24999 12.1639C6.26242 9.79237 7.65246 7.6444 9.81082 6.66156L9.18918 5.29644ZM4.75005 12.1687C4.79935 16.4046 8.27278 19.7986 12.5086 19.75L12.4914 18.25C9.08384 18.2892 6.28961 15.5588 6.24995 12.1513L4.75005 12.1687ZM12.4914 19.75C16.7272 19.7986 20.2007 16.4046 20.2499 12.1687L18.7501 12.1513C18.7104 15.5588 15.9162 18.2892 12.5086 18.25L12.4914 19.75ZM20.25 12.1561C20.2345 9.19951 18.5016 6.52171 15.8108 5.29644L15.1892 6.66156C17.3475 7.6444 18.7376 9.79237 18.75 12.1639L20.25 12.1561Z"
        fill="#d61f26"
      />
    </svg>
  );
}

export function SiteHeader() {
  const { itemCount, openCart } = useCart();
  const { itemCount: wishlistCount, openWishlist } = useWishlist();
  const { isAuthenticated, user, logout } = useCustomerAuth();
  const { homepageBanner } = useStorefrontData();
  const { isAuthenticated: isAdminAuthenticated, logout: adminLogout } = useAdminAuth();
  const { openAdminLogin, suppressNextAdminPrompt } = useAdminAuthModal();
  const { openLogin } = useAuthModal();
  const pathname = usePathname();
  const router = useRouter();
  const isAdminRoute = pathname.startsWith("/admin");
  const isStorefrontRoute = !isAdminRoute;
  const accountInitial = user?.name?.trim().charAt(0).toUpperCase() || "H";
  const announcementText =
    homepageBanner.announcementText || "FREE SHIPPING ON SELECTED STYLES";
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isAccountMenuOpen) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAccountMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isAccountMenuOpen]);

  return (
    <header className="sticky top-0 z-30 bg-white">
      <div className="announcement-strip border-b border-[var(--border)] overflow-hidden py-1.5 sm:py-2">
        <div className="announcement-track">
          <div className="announcement-content text-[9px] font-medium tracking-[0.16em] text-[var(--accent)] sm:text-[11px] sm:tracking-[0.2em]">
            <span>{announcementText}</span>
            <span>{announcementText}</span>
            <span>{announcementText}</span>
            <span>{announcementText}</span>
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-6 lg:px-8 lg:py-4">
        <div className="flex min-w-0 items-center gap-4 sm:gap-6 lg:gap-8">
          <Link href="/" className="flex min-w-0 items-center lg:hidden">
            <Image
              src="/HRUSHE-LOGO.png"
              alt="Hrushe logo"
              width={220}
              height={72}
              className="h-9 w-auto max-w-[150px] object-contain sm:h-11 sm:max-w-[180px] lg:h-14 lg:max-w-[220px]"
            />
          </Link>
          <nav className="hidden items-center gap-6 text-[0.92rem] text-[var(--muted)] lg:flex xl:gap-8">
            {navItems.map((item) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={`transition hover:text-[var(--accent)] ${
                  pathname === item.href ? "nav-link-active" : ""
                }`}
              >
                {item.label}
              </Link>
            ))}
            {isAdminAuthenticated ? (
              <Link
                href="/admin"
                className={`transition hover:text-[var(--accent)] ${
                  pathname === "/admin" ? "nav-link-active" : ""
                }`}
              >
                ADMIN
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => openAdminLogin("/admin")}
                className="transition hover:text-[var(--accent)]"
              >
                ADMIN
              </button>
            )}
          </nav>
        </div>

        <Link href="/" className="hidden items-center justify-center lg:flex">
          <Image
            src="/HRUSHE-LOGO.png"
            alt="Hrushe logo"
            width={220}
            height={72}
            className="h-14 w-auto max-w-[220px] object-contain"
          />
        </Link>

        <div className="flex shrink-0 items-center justify-end gap-0.5 sm:gap-1 lg:gap-2">
          <HeaderIcon href="/search" label="Search">
            <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-5.5 sm:w-5.5 lg:h-6 lg:w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="6" />
              <path d="M20 20l-4.2-4.2" />
            </svg>
          </HeaderIcon>
          {isStorefrontRoute ? (
            <>
              {isAuthenticated ? (
                <div ref={accountMenuRef} className="relative">
                  <HeaderIcon
                    onClick={() => setIsAccountMenuOpen((current) => !current)}
                    label="Account"
                    className="h-9 w-9 border border-[var(--border)] bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/14 sm:h-10 sm:w-10 lg:h-11 lg:w-11"
                  >
                    <span className="text-base font-semibold uppercase sm:text-[1.05rem] lg:text-[1.1rem]">
                      {accountInitial}
                    </span>
                  </HeaderIcon>
                  {isAccountMenuOpen ? (
                    <div className="absolute right-0 top-[calc(100%+0.6rem)] z-40 min-w-[180px] rounded-[1.4rem] border border-[var(--border)] bg-white/95 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.12)] backdrop-blur-xl">
                      <Link
                        href="/account"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex rounded-[1rem] px-4 py-3 text-sm text-[var(--foreground)] transition hover:bg-black/5"
                      >
                        My account
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          void logout();
                        }}
                        className="flex w-full items-center gap-3 rounded-[1rem] px-4 py-3 text-left text-sm text-[var(--accent)] transition hover:bg-black/5"
                      >
                        <LogoutIcon />
                        <span>Logout</span>
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <HeaderIcon
                  onClick={() => openLogin(pathname)}
                  label="Account"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-5.5 sm:w-5.5 lg:h-6 lg:w-6" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c1.7-3.3 4.3-5 8-5s6.3 1.7 8 5" />
                  </svg>
                </HeaderIcon>
              )}
              <HeaderIcon
                onClick={isAuthenticated ? openWishlist : () => openLogin(pathname)}
                label="Wishlist"
              >
                <span className="relative inline-flex">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-5.5 sm:w-5.5 lg:h-6 lg:w-6" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
                  </svg>
                  {wishlistCount > 0 ? (
                    <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-semibold text-white">
                      {wishlistCount}
                    </span>
                  ) : null}
                </span>
              </HeaderIcon>
              <button
                type="button"
                onClick={openCart}
                className="relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-black/5 sm:h-11 sm:w-11 lg:h-12 lg:w-12"
                aria-label="Cart"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-5.5 sm:w-5.5 lg:h-6 lg:w-6" fill="none" aria-hidden="true">
                  <path
                    d="M16 8H17.1597C18.1999 8 19.0664 8.79732 19.1528 9.83391L19.8195 17.8339C19.9167 18.9999 18.9965 20 17.8264 20H6.1736C5.00352 20 4.08334 18.9999 4.18051 17.8339L4.84718 9.83391C4.93356 8.79732 5.80009 8 6.84027 8H8M16 8H8M16 8L16 7C16 5.93913 15.5786 4.92172 14.8284 4.17157C14.0783 3.42143 13.0609 3 12 3C10.9391 3 9.92172 3.42143 9.17157 4.17157C8.42143 4.92172 8 5.93913 8 7L8 8M16 8L16 12M8 8L8 12"
                    stroke="#000000"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {itemCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-semibold text-white">
                    {itemCount}
                  </span>
                ) : null}
              </button>
            </>
          ) : null}
          {isAdminAuthenticated && isAdminRoute ? (
            <HeaderIcon
              onClick={() => {
                void (async () => {
                  suppressNextAdminPrompt();
                  await adminLogout();
                  router.push("/");
                })();
              }}
              label="Logout"
            >
              <LogoutIcon />
            </HeaderIcon>
          ) : null}
        </div>
      </div>

      <div className="border-t border-[var(--border)] lg:hidden">
        <nav className="mx-auto flex max-w-[1600px] items-center gap-4 overflow-x-auto px-4 py-2.5 text-xs text-[var(--muted)] sm:px-6 sm:text-sm">
          {navItems.map((item) => (
            <Link key={`mobile-${item.label}`} href={item.href} className="whitespace-nowrap">
              {item.label}
            </Link>
          ))}
          {isAdminAuthenticated ? (
            <Link href="/admin" className="whitespace-nowrap">
              ADMIN
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => openAdminLogin("/admin")}
              className="whitespace-nowrap"
            >
              ADMIN
            </button>
          )}
          {isStorefrontRoute && isAuthenticated ? (
            <span className="whitespace-nowrap text-xs uppercase tracking-[0.14em] text-[var(--accent)]">
              {user?.name}
            </span>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
