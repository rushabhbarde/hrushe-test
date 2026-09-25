"use client";

import Link from "next/link";

export type AccountSectionId =
  | "dashboard"
  | "profile"
  | "addresses"
  | "orders"
  | "wishlist"
  | "preferences"
  | "notifications"
  | "support";

type AccountShellProps = {
  activeSection: AccountSectionId;
  onSectionChange: (section: AccountSectionId) => void;
  userName: string;
  summaryBadges?: Partial<Record<AccountSectionId, string>>;
  children: React.ReactNode;
};

const navigationItems: {
  id: AccountSectionId;
  label: string;
  description: string;
}[] = [
  { id: "dashboard", label: "Overview", description: "Overview and quick links" },
  { id: "orders", label: "Orders", description: "History, tracking, and reorder" },
  { id: "wishlist", label: "Saved", description: "Saved products and move to cart" },
  { id: "addresses", label: "Addresses", description: "Shipping addresses and defaults" },
  { id: "profile", label: "Profile", description: "Personal details and account identity" },
  { id: "preferences", label: "Preferences", description: "Sizing, fit, and color tastes" },
  { id: "notifications", label: "Notifications", description: "Email and WhatsApp settings" },
  { id: "support", label: "Support", description: "Track, return, exchange, and contact help" },
];

/**
 * The Wardrobe: your name is the big word, the sections are words beside it.
 * Phone: the overview lists sections as rows; inside a section, "← Wardrobe" leads back.
 */
export function AccountShell({
  activeSection,
  onSectionChange,
  userName,
  summaryBadges,
  children,
}: AccountShellProps) {
  const firstName = (userName || "member").split(" ")[0];
  const activeItem = navigationItems.find((item) => item.id === activeSection) || navigationItems[0];

  const sectionButton = (item: (typeof navigationItems)[number], className: string) => {
    const badge = summaryBadges?.[item.id];
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onSectionChange(item.id)}
        aria-current={activeSection === item.id ? "page" : undefined}
        className={`${className} ${activeSection === item.id ? "is-active" : ""}`}
      >
        <span className="fr-word">{item.label}</span>
        {badge ? <span className="fr-mono">{badge}</span> : null}
      </button>
    );
  };

  return (
    <div className="fr-account grid gap-8 lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)] lg:gap-16">
      <div className="flex flex-col gap-6 lg:hidden">
        {activeSection === "dashboard" ? (
          <>
            <div className="flex flex-col gap-3">
              <span className="fr-mono fr-muted">Wardrobe</span>
              <h1 className="fr-word text-[clamp(3rem,15vw,5rem)]">{firstName}.</h1>
            </div>
            <nav aria-label="Wardrobe sections" className="flex flex-col">
              {navigationItems
                .filter((item) => item.id !== "dashboard")
                .map((item) => sectionButton(item, "fr-account-row"))}
            </nav>
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <button type="button" onClick={() => onSectionChange("dashboard")} className="fr-mono fr-choice fr-link is-active self-start">
              ← Wardrobe
            </button>
            <h1 className="fr-word text-[clamp(3rem,15vw,5rem)]">{activeItem.label}.</h1>
          </div>
        )}
      </div>

      <aside className="hidden h-fit flex-col gap-8 lg:sticky lg:top-24 lg:flex">
        <div className="flex flex-col gap-3">
          <span className="fr-mono fr-muted">Wardrobe</span>
          <h1 className="fr-word break-words text-[clamp(3rem,5vw,4.75rem)]">{firstName}.</h1>
        </div>
        <nav aria-label="Wardrobe sections" className="flex flex-col">
          {navigationItems.map((item) => sectionButton(item, "fr-account-row"))}
        </nav>
        <Link href="/track-order" className="fr-mono fr-link self-start">
          Track an order without signing in
        </Link>
      </aside>

      <div className="flex min-w-0 flex-col gap-12">{children}</div>
    </div>
  );
}

export function AccountSectionCard({
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-6 border-t border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] pt-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex max-w-2xl flex-col gap-3">
          <span className="fr-mono fr-muted">{eyebrow}</span>
          <h2 className="fr-word text-[clamp(2rem,4vw,3rem)]">{title}</h2>
          {description ? <p className="text-sm leading-7 text-[var(--muted)]">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div>{children}</div>
    </section>
  );
}
