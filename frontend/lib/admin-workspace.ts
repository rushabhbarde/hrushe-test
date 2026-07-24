import type {
  Product,
  ProductCollectionLabel,
  ProductFitType,
  ProductGender,
  ProductStatus,
  ProductReview,
} from "@/lib/catalog";
import { categories as defaultCatalogCategories } from "@/lib/catalog";
import type { AdminCustomer } from "@/lib/admin";
import type { OrderRecord } from "@/lib/orders";
import {
  HRUSHE_LOGO_PATH,
  HRUSHE_SYMBOL_LOGO_PATH,
} from "@/lib/brand-assets";

export type AdminBanner = {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  posterImage: string;
  desktopImage?: string;
  mobileImage?: string;
  enabled: boolean;
  scheduleStart: string | null;
  scheduleEnd: string | null;
};

export type HomepageAudience = "home" | "women" | "men";
export type HomepageSectionType = "entry-cards" | "audience-hero" | "category-cards" | "sale-banner";
export type HomepageTitleFontSize = "small" | "medium" | "large";
export type HomepageTextPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";
export type HomepageTextAlign = "left" | "center" | "right";

export type HomepageCard = {
  id: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  image: string;
  mobileImage: string;
  imageAlt: string;
  objectPosition: string;
  titleFontSize: HomepageTitleFontSize;
  titlePosition: HomepageTextPosition;
  textAlign: HomepageTextAlign;
  isVisible: boolean;
};

export type HomepageSection = {
  id: string;
  audience: HomepageAudience;
  sectionType: HomepageSectionType;
  label: string;
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  image: string;
  mobileImage: string;
  imageAlt: string;
  objectPosition: string;
  backgroundColor: "default" | "light" | "dark";
  textColor: "default" | "light" | "dark";
  titleFontSize: HomepageTitleFontSize;
  titlePosition: HomepageTextPosition;
  textAlign: HomepageTextAlign;
  cards: HomepageCard[];
  displayOrder: number;
  isVisible: boolean;
  publishStart: string | null;
  publishEnd: string | null;
};

export type HomeManagement = {
  banners: AdminBanner[];
  sections: HomepageSection[];
  lastPublishedAt: string | null;
};

export type ProductAdminMeta = {
  productId: string;
  status: ProductStatus;
  fitType: ProductFitType;
  gender: ProductGender;
  collectionLabels: ProductCollectionLabel[];
  galleryImages: string[];
};

export type OrderAdminMeta = {
  orderId: string;
  shippingStatus: "Queued" | "Manifested" | "In Transit" | "Out for Delivery" | "Delivered" | "Return Pickup";
  refundState: "none" | "requested" | "processed";
  shippingUpdates: Array<{
    id: string;
    type: "shipment" | "delivery" | "return";
    title: string;
    detail: string;
    timestamp: string;
  }>;
  returnPickupTracking: string;
};

export type CustomerAdminMeta = {
  customerId: string;
  blocked: boolean;
  note: string;
};

export type CouponRecord = {
  id: string;
  code: string;
  title: string;
  type: "percentage" | "flat" | "free-shipping";
  value: number;
  expiresAt: string | null;
  usageLimit: number;
  usedCount: number;
  active: boolean;
  customerEmail: string;
};

export const contentPageKeys = [
  "aboutUs",
  "contactUs",
  "faq",
  "privacyPolicy",
  "returnPolicy",
  "shippingPolicy",
  "termsAndConditions",
  "sizeGuide",
] as const;

export type ContentPageKey = (typeof contentPageKeys)[number];

export type ContentPageRecord = {
  title: string;
  excerpt: string;
  body: string;
  seoTitle: string;
  seoDescription: string;
  updatedAt: string;
};

export type MediaAsset = {
  id: string;
  name: string;
  url: string;
  folder: string;
  tags: string[];
  createdAt: string;
};

export type ReviewModerationStatus = "approved" | "rejected" | "hidden";

export type ReviewModerationRecord = {
  reviewKey: string;
  productId: string;
  status: ReviewModerationStatus;
};

export type WebsiteSettings = {
  brandName: string;
  logoUrl: string;
  faviconUrl: string;
  contactEmail: string;
  contactPhone: string;
  supportWhatsapp: string;
  instagramUrl: string;
  facebookUrl: string;
  pinterestUrl: string;
  seoTitle: string;
  seoDescription: string;
  analyticsId: string;
  metaPixelId: string;
  maintenanceMode: boolean;
};

export const adminPermissionCatalog = [
  "dashboard.view",
  "home.manage",
  "products.view",
  "products.edit",
  "products.delete",
  "orders.view",
  "orders.manage",
  "shipping.manage",
  "support.manage",
  "customers.view",
  "customers.manage",
  "coupons.manage",
  "content.manage",
  "media.manage",
  "reviews.manage",
  "reports.view",
  "settings.manage",
  "roles.manage",
] as const;

export type AdminPermission = (typeof adminPermissionCatalog)[number];
export type AdminRoleId =
  | "super-admin"
  | "brand-growth-manager"
  | "operations-manager"
  | "catalog-manager";

export type AdminRoleRecord = {
  id: AdminRoleId;
  name: string;
  description: string;
  permissions: AdminPermission[];
};

export const adminRoleDefinitions: AdminRoleRecord[] = [
  {
    id: "super-admin",
    name: "Super Admin",
    description: "Full control over storefront, operations, staff, settings, and reporting.",
    permissions: [...adminPermissionCatalog],
  },
  {
    id: "brand-growth-manager",
    name: "Brand & Growth Manager",
    description: "Owns homepage banners, content, media, reviews, coupons, and sales visibility.",
    permissions: [
      "dashboard.view",
      "home.manage",
      "orders.view",
      "coupons.manage",
      "content.manage",
      "media.manage",
      "reviews.manage",
      "reports.view",
    ],
  },
  {
    id: "operations-manager",
    name: "Operations Manager",
    description: "Owns order fulfillment, tracking, shipping, returns, support, and customer context.",
    permissions: [
      "dashboard.view",
      "orders.view",
      "orders.manage",
      "shipping.manage",
      "support.manage",
      "customers.view",
      "reports.view",
    ],
  },
  {
    id: "catalog-manager",
    name: "Catalog Manager",
    description: "Owns product catalog, categories, product media, merchandising status, and review visibility.",
    permissions: [
      "dashboard.view",
      "products.view",
      "products.edit",
      "products.delete",
      "media.manage",
      "reviews.manage",
    ],
  },
];

export type ShippingSettings = {
  defaultCourierPartner: string;
  supportEmail: string;
  returnPickupPartner: string;
  deliveryUpdateTemplate: string;
};

export type AdminWorkspace = {
  version: number;
  homeManagement: HomeManagement;
  catalogCategories: string[];
  productMeta: Record<string, ProductAdminMeta>;
  orderMeta: Record<string, OrderAdminMeta>;
  customerMeta: Record<string, CustomerAdminMeta>;
  coupons: CouponRecord[];
  contentPages: Record<ContentPageKey, ContentPageRecord>;
  mediaLibrary: MediaAsset[];
  reviewModeration: Record<string, ReviewModerationRecord>;
  websiteSettings: WebsiteSettings;
  roles: AdminRoleRecord[];
  shipping: ShippingSettings;
};

function timestamp(daysOffset = 0) {
  const value = new Date();
  value.setDate(value.getDate() + daysOffset);
  return value.toISOString();
}

const defaultContentPages = contentPageKeys.reduce<Record<ContentPageKey, ContentPageRecord>>(
  (accumulator, key) => {
    const titleMap: Record<ContentPageKey, string> = {
      aboutUs: "About HRUSHE",
      contactUs: "Contact HRUSHE",
      faq: "Frequently Asked Questions",
      privacyPolicy: "Privacy Policy",
      returnPolicy: "Return Policy",
      shippingPolicy: "Shipping Policy",
      termsAndConditions: "Terms & Conditions",
      sizeGuide: "Size Guide",
    };

    accumulator[key] = {
      title: titleMap[key],
      excerpt: "Storefront information maintained by the HRUSHE team.",
      body: `${titleMap[key]}\n\nAdd reviewed, customer-facing information before publishing this page.`,
      seoTitle: titleMap[key],
      seoDescription: "Official HRUSHE customer information.",
      updatedAt: timestamp(),
    };

    return accumulator;
  },
  {} as Record<ContentPageKey, ContentPageRecord>
);

export const homepageAudienceLabels: Record<HomepageAudience, string> = {
  home: "Main homepage",
  women: "Women",
  men: "Men",
};

export const homepageSectionTypeLabels: Record<HomepageSectionType, string> = {
  "entry-cards": "Entry cards",
  "audience-hero": "Audience hero",
  "category-cards": "Category card rail",
  "sale-banner": "Sale banner",
};

export const homepageTitleFontSizeLabels: Record<HomepageTitleFontSize, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

export const homepageTextPositionLabels: Record<HomepageTextPosition, string> = {
  "top-left": "Top left",
  "top-center": "Top centre",
  "top-right": "Top right",
  "center-left": "Centre left",
  center: "Centre",
  "center-right": "Centre right",
  "bottom-left": "Bottom left",
  "bottom-center": "Bottom centre",
  "bottom-right": "Bottom right",
};

export const homepageTextAlignLabels: Record<HomepageTextAlign, string> = {
  left: "Left",
  center: "Centre",
  right: "Right",
};

function defaultHomepageCard(
  card: Partial<HomepageCard> & Pick<HomepageCard, "id" | "title" | "ctaLink" | "image" | "imageAlt">
): HomepageCard {
  return {
    subtitle: "",
    ctaText: "",
    mobileImage: "",
    objectPosition: "center",
    titleFontSize: "small",
    titlePosition: "bottom-right",
    textAlign: "right",
    isVisible: true,
    ...card,
  };
}

export const defaultHomepageSections: HomepageSection[] = [
  {
    id: "home-entry",
    audience: "home",
    sectionType: "entry-cards",
    label: "Homepage audience entry",
    title: "Shop Women & Men",
    subtitle: "",
    description: "",
    ctaText: "",
    ctaLink: "",
    secondaryCtaText: "",
    secondaryCtaLink: "",
    image: "",
    mobileImage: "",
    imageAlt: "",
    objectPosition: "center",
    backgroundColor: "dark",
    textColor: "light",
    titleFontSize: "large",
    titlePosition: "bottom-center",
    textAlign: "center",
    cards: [
      defaultHomepageCard({
        id: "entry-women",
        title: "Shop Women",
        subtitle: "Men >",
        ctaLink: "/women",
        image: "",
        imageAlt: "HRUSHE womenswear campaign",
        objectPosition: "center",
        titleFontSize: "large",
        titlePosition: "bottom-center",
        textAlign: "center",
      }),
      defaultHomepageCard({
        id: "entry-men",
        title: "Shop Men",
        subtitle: "< Women",
        ctaLink: "/men",
        image: "",
        imageAlt: "HRUSHE menswear campaign",
        objectPosition: "center",
        titleFontSize: "large",
        titlePosition: "bottom-center",
        textAlign: "center",
      }),
    ],
    displayOrder: 10,
    isVisible: true,
    publishStart: null,
    publishEnd: null,
  },
  {
    id: "women-hero",
    audience: "women",
    sectionType: "audience-hero",
    label: "Women hero",
    title: "Summer: New & Now",
    subtitle: "",
    description: "",
    ctaText: "Shop Women",
    ctaLink: "/women",
    secondaryCtaText: "Shop All Womenswear",
    secondaryCtaLink: "/collection/women",
    image: "",
    mobileImage: "",
    imageAlt: "HRUSHE Women campaign",
    objectPosition: "center",
    backgroundColor: "dark",
    textColor: "light",
    titleFontSize: "large",
    titlePosition: "bottom-center",
    textAlign: "center",
    cards: [],
    displayOrder: 10,
    isVisible: true,
    publishStart: null,
    publishEnd: null,
  },
  {
    id: "women-categories",
    audience: "women",
    sectionType: "category-cards",
    label: "Women category cards",
    title: "Women categories",
    subtitle: "",
    description: "",
    ctaText: "",
    ctaLink: "",
    secondaryCtaText: "",
    secondaryCtaLink: "",
    image: "",
    mobileImage: "",
    imageAlt: "",
    objectPosition: "center",
    backgroundColor: "dark",
    textColor: "light",
    titleFontSize: "small",
    titlePosition: "bottom-right",
    textAlign: "right",
    cards: [
      defaultHomepageCard({
        id: "women-dresses",
        title: "Dresses",
        ctaLink: "/collection/women",
        image: "",
        imageAlt: "HRUSHE womenswear dresses edit",
        objectPosition: "center",
      }),
      defaultHomepageCard({
        id: "women-shirts",
        title: "Shirts & Blouses",
        ctaLink: "/collection/women",
        image: "",
        imageAlt: "HRUSHE womenswear shirts and blouses edit",
        objectPosition: "right center",
      }),
      defaultHomepageCard({
        id: "women-tshirts",
        title: "T-Shirts & Tank Tops",
        ctaLink: "/collection/women",
        image: "",
        imageAlt: "HRUSHE womenswear t-shirts and tank tops edit",
        objectPosition: "center",
      }),
      defaultHomepageCard({
        id: "women-pants",
        title: "Pants & Shorts",
        ctaLink: "/collection/women",
        image: "",
        imageAlt: "HRUSHE womenswear pants and shorts edit",
        objectPosition: "left center",
      }),
    ],
    displayOrder: 20,
    isVisible: true,
    publishStart: null,
    publishEnd: null,
  },
  {
    id: "women-sale",
    audience: "women",
    sectionType: "sale-banner",
    label: "Women sale banner",
    title: "Sale: New Pieces Added",
    subtitle: "Online Exclusive",
    description: "",
    ctaText: "Shop Women",
    ctaLink: "/collection/women",
    secondaryCtaText: "",
    secondaryCtaLink: "",
    image: "",
    mobileImage: "",
    imageAlt: "HRUSHE womenswear sale campaign",
    objectPosition: "center",
    backgroundColor: "dark",
    textColor: "light",
    titleFontSize: "large",
    titlePosition: "bottom-center",
    textAlign: "center",
    cards: [],
    displayOrder: 30,
    isVisible: true,
    publishStart: null,
    publishEnd: null,
  },
  {
    id: "men-hero",
    audience: "men",
    sectionType: "audience-hero",
    label: "Men hero",
    title: "Defined Quietly",
    subtitle: "",
    description: "",
    ctaText: "Shop Men",
    ctaLink: "/men",
    secondaryCtaText: "Shop All Menswear",
    secondaryCtaLink: "/collection/men",
    image: "",
    mobileImage: "",
    imageAlt: "HRUSHE Men campaign",
    objectPosition: "center",
    backgroundColor: "dark",
    textColor: "light",
    titleFontSize: "large",
    titlePosition: "bottom-center",
    textAlign: "center",
    cards: [],
    displayOrder: 10,
    isVisible: true,
    publishStart: null,
    publishEnd: null,
  },
  {
    id: "men-categories",
    audience: "men",
    sectionType: "category-cards",
    label: "Men category cards",
    title: "Men categories",
    subtitle: "",
    description: "",
    ctaText: "",
    ctaLink: "",
    secondaryCtaText: "",
    secondaryCtaLink: "",
    image: "",
    mobileImage: "",
    imageAlt: "",
    objectPosition: "center",
    backgroundColor: "dark",
    textColor: "light",
    titleFontSize: "small",
    titlePosition: "bottom-right",
    textAlign: "right",
    cards: [
      defaultHomepageCard({
        id: "men-shirts",
        title: "Shirts",
        ctaLink: "/collection/men",
        image: "",
        imageAlt: "HRUSHE menswear shirts edit",
        objectPosition: "center",
      }),
      defaultHomepageCard({
        id: "men-tshirts",
        title: "T-Shirts & Tank Tops",
        ctaLink: "/collection/men",
        image: "",
        imageAlt: "HRUSHE menswear t-shirts and tank tops edit",
        objectPosition: "center",
      }),
      defaultHomepageCard({
        id: "men-polos",
        title: "Polo Shirts",
        ctaLink: "/collection/men",
        image: "",
        imageAlt: "HRUSHE menswear polo shirts edit",
        objectPosition: "center",
      }),
      defaultHomepageCard({
        id: "men-pants",
        title: "Pants & Shorts",
        ctaLink: "/collection/men",
        image: "",
        imageAlt: "HRUSHE menswear pants and shorts edit",
        objectPosition: "left center",
      }),
    ],
    displayOrder: 20,
    isVisible: true,
    publishStart: null,
    publishEnd: null,
  },
  {
    id: "men-sale",
    audience: "men",
    sectionType: "sale-banner",
    label: "Men sale banner",
    title: "Sale: New Pieces Added",
    subtitle: "Online Exclusive",
    description: "",
    ctaText: "Shop Men",
    ctaLink: "/collection/men",
    secondaryCtaText: "",
    secondaryCtaLink: "",
    image: "",
    mobileImage: "",
    imageAlt: "HRUSHE menswear sale campaign",
    objectPosition: "center",
    backgroundColor: "dark",
    textColor: "light",
    titleFontSize: "large",
    titlePosition: "bottom-center",
    textAlign: "center",
    cards: [],
    displayOrder: 30,
    isVisible: true,
    publishStart: null,
    publishEnd: null,
  },
];

export const defaultAdminWorkspace: AdminWorkspace = {
  version: 1,
  homeManagement: {
    banners: [
      {
        id: "banner-01",
        label: "Elevated Everyday",
        title: "Defined Quietly",
        subtitle: "Everyday uniforms with clear proportions, honest materials, and repeat-wear construction.",
        ctaText: "Shop Collection",
        ctaLink: "/shop",
        mediaType: "image",
        mediaUrl: "",
        posterImage: "",
        enabled: false,
        scheduleStart: null,
        scheduleEnd: null,
      },
    ],
    sections: defaultHomepageSections,
    lastPublishedAt: null,
  },
  catalogCategories: [...defaultCatalogCategories],
  productMeta: {},
  orderMeta: {},
  customerMeta: {},
  coupons: [],
  contentPages: defaultContentPages,
  mediaLibrary: [],
  reviewModeration: {},
  websiteSettings: {
    brandName: "HRUSHE",
    logoUrl: HRUSHE_LOGO_PATH,
    faviconUrl: HRUSHE_SYMBOL_LOGO_PATH,
    contactEmail: "team@hrushe.in",
    contactPhone: "+91 91128 54988",
    supportWhatsapp: "+91 91128 54988",
    instagramUrl: "https://instagram.com/hrushe.in",
    facebookUrl: "",
    pinterestUrl: "",
    seoTitle: "HRUSHE | Defined Quietly",
    seoDescription:
      "Everyday uniforms with clear proportions, honest materials, and repeat-wear construction.",
    analyticsId: "",
    metaPixelId: "",
    maintenanceMode: false,
  },
  roles: adminRoleDefinitions,
  shipping: {
    defaultCourierPartner: "",
    supportEmail: "team@hrushe.in",
    returnPickupPartner: "",
    deliveryUpdateTemplate: "",
  },
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === "[object Object]";
}

export function deepMergeWorkspace<T>(baseValue: T, nextValue: Partial<T> | undefined): T {
  if (nextValue === undefined) {
    return baseValue;
  }

  if (Array.isArray(baseValue) || Array.isArray(nextValue)) {
    return nextValue as T;
  }

  if (!isObject(baseValue) || !isObject(nextValue)) {
    return nextValue as T;
  }

  const merged: Record<string, unknown> = { ...baseValue };

  Object.entries(nextValue).forEach(([key, value]) => {
    merged[key] = deepMergeWorkspace(
      (baseValue as Record<string, unknown>)[key],
      value as Partial<T>
    );
  });

  return merged as T;
}

export function normalizeAdminWorkspace(payload: Partial<AdminWorkspace> | null | undefined) {
  return deepMergeWorkspace(defaultAdminWorkspace, payload || {});
}

function deriveFallbackProductStatus(product: Product): ProductStatus {
  if (!product.name?.trim() || !product.description?.trim() || product.price <= 0) {
    return "Draft";
  }

  if (!product.sizes?.length) {
    return "Sold Out";
  }

  return "Active";
}

export function resolveProductAdminMeta(workspace: AdminWorkspace, product: Product): ProductAdminMeta {
  const current = workspace.productMeta[product.id];

  return {
    productId: product.id,
    status: product.status || current?.status || deriveFallbackProductStatus(product),
    fitType: product.fitType || current?.fitType || "Regular",
    gender: product.gender || current?.gender || "Unisex",
    collectionLabels:
      product.collectionLabels ||
      current?.collectionLabels ||
      [
        ...(product.featured ? (["Featured"] as ProductCollectionLabel[]) : []),
        ...(product.bestSeller || product.newArrival ? (["Collection"] as ProductCollectionLabel[]) : []),
      ],
    galleryImages: current?.galleryImages || product.galleryImages || product.images.slice(1),
  };
}

export function resolveOrderAdminMeta(workspace: AdminWorkspace, order: OrderRecord): OrderAdminMeta {
  const current = workspace.orderMeta[order.id];

  return {
    orderId: order.id,
    shippingStatus:
      current?.shippingStatus ||
      (order.orderStatus === "Delivered"
        ? "Delivered"
        : order.orderStatus === "Out for delivery"
          ? "Out for Delivery"
          : order.orderStatus === "Shipped"
            ? "In Transit"
            : "Queued"),
    refundState: current?.refundState || "none",
    shippingUpdates: current?.shippingUpdates || [],
    returnPickupTracking: current?.returnPickupTracking || "",
  };
}

export function resolveCustomerAdminMeta(workspace: AdminWorkspace, customer: AdminCustomer): CustomerAdminMeta {
  return (
    workspace.customerMeta[customer.id] || {
      customerId: customer.id,
      blocked: false,
      note: "",
    }
  );
}

export function buildReviewKey(productId: string, review: ProductReview, index: number) {
  return `${productId}:${review.id || review.createdAt || index}`;
}

export function resolveReviewModeration(
  workspace: AdminWorkspace,
  productId: string,
  review: ProductReview,
  index: number
): ReviewModerationRecord {
  const reviewKey = buildReviewKey(productId, review, index);

  return (
    workspace.reviewModeration[reviewKey] || {
      reviewKey,
      productId,
      status: "approved",
    }
  );
}

export function resolveCatalogCategories(workspace: AdminWorkspace, seededCategories: string[] = []) {
  const merged = [...(workspace.catalogCategories || []), ...seededCategories]
    .map((category) => String(category || "").trim())
    .filter(Boolean);

  return Array.from(new Set(merged));
}

export function getActiveHomepageBanners(workspace: AdminWorkspace) {
  const now = Date.now();

  return workspace.homeManagement.banners.filter((banner) => {
    if (!banner.enabled) {
      return false;
    }

    const startsAt = banner.scheduleStart ? new Date(banner.scheduleStart).getTime() : null;
    const endsAt = banner.scheduleEnd ? new Date(banner.scheduleEnd).getTime() : null;

    if (Number.isFinite(startsAt) && (startsAt as number) > now) {
      return false;
    }

    if (Number.isFinite(endsAt) && (endsAt as number) < now) {
      return false;
    }

    return true;
  });
}

export function sortHomepageRecords<T extends { displayOrder?: number; id?: string }>(records: T[]) {
  return [...records].sort((first, second) => {
    const orderDifference = (first.displayOrder || 0) - (second.displayOrder || 0);
    if (orderDifference !== 0) {
      return orderDifference;
    }

    return String(first.id || "").localeCompare(String(second.id || ""));
  });
}

export function isHomepageSectionActive(section: HomepageSection, now = Date.now()) {
  if (!section.isVisible) {
    return false;
  }

  const startsAt = section.publishStart ? new Date(section.publishStart).getTime() : null;
  const endsAt = section.publishEnd ? new Date(section.publishEnd).getTime() : null;

  if (Number.isFinite(startsAt) && (startsAt as number) > now) {
    return false;
  }

  if (Number.isFinite(endsAt) && (endsAt as number) < now) {
    return false;
  }

  return true;
}

export function getHomepageSectionsForAudience(
  homeManagement: HomeManagement,
  audience: HomepageAudience,
  { includeHidden = false }: { includeHidden?: boolean } = {}
) {
  const sections = homeManagement.sections.filter((section) => section.audience === audience);
  const eligibleSections = includeHidden
    ? sections
    : sections.filter((section) => isHomepageSectionActive(section));

  return sortHomepageRecords(eligibleSections);
}

export function getVisibleHomepageCards(cards: HomepageCard[]) {
  return cards.filter((card) => card.isVisible);
}
