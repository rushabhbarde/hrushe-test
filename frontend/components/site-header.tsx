"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthModal } from "@/components/auth-modal-provider";
import { useCart } from "@/components/cart-provider";
import { useCustomerAuth } from "@/components/customer-auth-provider";
import { useWishlist } from "@/components/wishlist-provider";

const navItems = [
  { href: "/new-in", label: "New In" },
  { href: "/shop", label: "Shop" },
  { href: "/story", label: "Story" },
];

function HeaderIcon({
  label,
  children,
  onClick,
  href,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  const className =
    "flex h-11 w-11 items-center justify-center transition hover:bg-[var(--hover-fill)]";

  if (href) {
    return (
      <Link href={href} aria-label={label} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" aria-label={label} onClick={onClick} className={className}>
      {children}
    </button>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 -0.5 25 25" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M11.75 9.874C11.75 10.2882 12.0858 10.624 12.5 10.624C12.9142 10.624 13.25 10.2882 13.25 9.874H11.75ZM13.25 4C13.25 3.58579 12.9142 3.25 12.5 3.25C12.0858 3.25 11.75 3.58579 11.75 4H13.25ZM9.81082 6.66156C10.1878 6.48991 10.3542 6.04515 10.1826 5.66818C10.0109 5.29121 9.56615 5.12478 9.18918 5.29644L9.81082 6.66156ZM5.5 12.16L4.7499 12.1561L4.75005 12.1687L5.5 12.16ZM12.5 19L12.5086 18.25C12.5029 18.25 12.4971 18.25 12.4914 18.25L12.5 19ZM19.5 12.16L20.2501 12.1687L20.25 12.1561L19.5 12.16ZM15.8108 5.29644C15.4338 5.12478 14.9891 5.29121 14.8174 5.66818C14.6458 6.04515 14.8122 6.48991 15.1892 6.66156L15.8108 5.29644ZM13.25 9.874V4H11.75V9.874H13.25ZM9.18918 5.29644C6.49843 6.52171 4.7655 9.19951 4.75001 12.1561L6.24999 12.1639C6.26242 9.79237 7.65246 7.6444 9.81082 6.66156L9.18918 5.29644ZM4.75005 12.1687C4.79935 16.4046 8.27278 19.7986 12.5086 19.75L12.4914 18.25C9.08384 18.2892 6.28961 15.5588 6.24995 12.1513L4.75005 12.1687ZM12.4914 19.75C16.7272 19.7986 20.2007 16.4046 20.2499 12.1687L18.7501 12.1513C18.7104 15.5588 15.9162 18.2892 12.5086 18.25L12.4914 19.75ZM20.25 12.1561C20.2345 9.19951 18.5016 6.52171 15.8108 5.29644L15.1892 6.66156C17.3475 7.6444 18.7376 9.79237 18.75 12.1639L20.25 12.1561Z"
        fill="#d61f26"
      />
    </svg>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount, openCart } = useCart();
  const { itemCount: wishlistCount, openWishlist } = useWishlist();
  const { isAuthenticated, user, logout } = useCustomerAuth();
  const { openLogin } = useAuthModal();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuToggleRef = useRef<HTMLButtonElement | null>(null);
  const accountInitial = user?.name?.charAt(0).toUpperCase() || "H";

  useEffect(() => {
    if (!isAccountMenuOpen && !isMobileMenuOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
      if (
        !mobileMenuRef.current?.contains(event.target as Node) &&
        !mobileMenuToggleRef.current?.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAccountMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isAccountMenuOpen, isMobileMenuOpen]);

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]">
      <div className="border-b border-[var(--border)] px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-[var(--muted)] sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between">
          <span>Dispatches in 1–3 business days · 7-day returns</span>
          <span className="hidden sm:block">One free size exchange</span>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-4 py-2 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="flex items-center gap-2 lg:gap-7">
            <button
              ref={mobileMenuToggleRef}
              type="button"
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              className="flex h-11 w-11 items-center justify-center lg:hidden"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              <span className="relative flex h-4 w-5 items-center justify-center">
                <span
                  className={`absolute h-px w-5 bg-[var(--foreground)] transition ${
                    isMobileMenuOpen ? "rotate-45" : "-translate-y-[5px]"
                  }`}
                />
                <span
                  className={`absolute h-px w-5 bg-[var(--foreground)] transition ${
                    isMobileMenuOpen ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`absolute h-px w-5 bg-[var(--foreground)] transition ${
                    isMobileMenuOpen ? "-rotate-45" : "translate-y-[5px]"
                  }`}
                />
              </span>
            </button>

            <nav className="hidden items-center gap-8 text-[0.78rem] font-medium uppercase tracking-[0.08em] text-[var(--muted)] lg:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={pathname === item.href ? "nav-link-active" : "hover:text-[var(--foreground)]"}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <Link href="/" className="flex items-center justify-center">
            <Image
              src="/NEW_LOGO.png"
              alt="Hrushe logo"
              width={220}
              height={72}
              loading="eager"
              className="h-9 w-auto object-contain sm:h-10 lg:h-12"
            />
          </Link>

          <div className="flex items-center justify-end gap-0.5 sm:gap-1">
            <div ref={accountMenuRef} className="relative hidden lg:block">
              {isAuthenticated ? (
                <HeaderIcon label="Account" onClick={() => setIsAccountMenuOpen((current) => !current)}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--accent)]/8 text-sm font-semibold text-[var(--accent)]">
                    {accountInitial}
                  </span>
                </HeaderIcon>
              ) : (
                <HeaderIcon label="Account" onClick={() => openLogin(pathname)}>
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c1.7-3.3 4.3-5 8-5s6.3 1.7 8 5" />
                  </svg>
                </HeaderIcon>
              )}

              {isAccountMenuOpen ? (
                <div className="absolute right-0 top-[calc(100%+0.6rem)] min-w-[190px] border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[0_20px_45px_rgba(0,0,0,0.08)]">
                  <Link href="/account" className="block px-4 py-3 text-sm hover:bg-[var(--hover-fill)]" onClick={() => setIsAccountMenuOpen(false)}>
                    My account
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      void logout();
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[var(--accent)] hover:bg-[var(--hover-fill)]"
                  >
                    <LogoutIcon />
                    Logout
                  </button>
                </div>
              ) : null}
            </div>

            <div className="hidden lg:block">
              <HeaderIcon label="Wishlist" onClick={isAuthenticated ? openWishlist : () => openLogin(pathname)}>
                <span className="relative inline-flex">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
                  </svg>
                  {wishlistCount > 0 ? (
                    <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[9px] font-semibold text-white">
                      {wishlistCount}
                    </span>
                  ) : null}
                </span>
              </HeaderIcon>
            </div>

            <HeaderIcon label="Cart" onClick={openCart}>
              <span className="relative inline-flex">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                  <path
                    d="M16 8H17.1597C18.1999 8 19.0664 8.79732 19.1528 9.83391L19.8195 17.8339C19.9167 18.9999 18.9965 20 17.8264 20H6.1736C5.00352 20 4.08334 18.9999 4.18051 17.8339L4.84718 9.83391C4.93356 8.79732 5.80009 8 6.84027 8H8M16 8H8M16 8L16 7C16 5.93913 15.5786 4.92172 14.8284 4.17157C14.0783 3.42143 13.0609 3 12 3C10.9391 3 9.92172 3.42143 9.17157 4.17157C8.42143 4.92172 8 5.93913 8 7L8 8M16 8L16 12M8 8L8 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {itemCount > 0 ? (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[9px] font-semibold text-white">
                    {itemCount}
                  </span>
                ) : null}
              </span>
            </HeaderIcon>

          </div>
        </div>
      </div>

      {isMobileMenuOpen ? (
        <div className="border-t border-[var(--border)] lg:hidden">
          <div ref={mobileMenuRef} className="mobile-drawer-enter mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
            <div className="bg-[var(--background)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <p className="eyebrow text-[var(--muted)]">Menu</p>
                <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--muted)]">
                  HRUSHE
                </p>
              </div>
              <nav className="mt-2 flex flex-col divide-y divide-[var(--border)] text-sm">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-1 py-4 text-[0.78rem] font-medium uppercase tracking-[0.16em] ${
                      pathname === item.href ? "text-[var(--accent)]" : "text-[var(--foreground)]"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span aria-hidden="true">↗</span>
                  </Link>
                ))}
                {isAuthenticated ? (
                  <Link href="/account" onClick={() => setIsMobileMenuOpen(false)} className="px-1 py-4 text-[0.78rem] uppercase tracking-[0.16em] text-[var(--muted)]">
                    Signed in as {user?.name}
                  </Link>
                ) : null}
              </nav>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (isAuthenticated) {
                      router.push("/account");
                    } else {
                      openLogin(pathname);
                    }
                  }}
                  className="min-h-11 border border-[var(--border)] text-[0.68rem] font-medium uppercase tracking-[0.14em]"
                >
                  Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (isAuthenticated) {
                      openWishlist();
                    } else {
                      openLogin(pathname);
                    }
                  }}
                  className="min-h-11 border border-[var(--border)] text-[0.68rem] font-medium uppercase tracking-[0.14em]"
                >
                  Wishlist{wishlistCount > 0 ? ` ${wishlistCount}` : ""}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openCart();
                  }}
                  className="min-h-11 border border-[var(--foreground)] bg-[var(--foreground)] text-[0.68rem] font-medium uppercase tracking-[0.14em] text-[var(--background)]"
                >
                  Cart{itemCount > 0 ? ` ${itemCount}` : ""}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
