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
  homeManagement: {
    banners: AdminBanner[];
    lastPublishedAt: string | null;
  };
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

export const defaultAdminWorkspace: AdminWorkspace = {
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
    logoUrl: "/NEW_LOGO.png",
    faviconUrl: "/brand/hrushe-sylogo-192.png",
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
        ...(product.newIn ? (["New In"] as ProductCollectionLabel[]) : []),
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
