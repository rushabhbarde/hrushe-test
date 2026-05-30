import type {
  Product,
  ProductCollectionLabel,
  ProductFitType,
  ProductGender,
  ProductStatus,
  ProductReview,
} from "@/lib/catalog";
import type { AdminCustomer } from "@/lib/admin";
import type { OrderRecord } from "@/lib/orders";

export type AdminBanner = {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  desktopImage: string;
  mobileImage: string;
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
  "customers.view",
  "customers.manage",
  "coupons.manage",
  "content.manage",
  "media.manage",
  "reviews.manage",
  "reports.view",
  "settings.manage",
] as const;

export type AdminPermission = (typeof adminPermissionCatalog)[number];

export type AdminRoleRecord = {
  id: string;
  name: "Super Admin" | "Product Manager" | "Order Manager" | "Customer Support";
  description: string;
  permissions: AdminPermission[];
};

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
      excerpt: "Luxury essentials, written with clarity and restraint.",
      body: `${titleMap[key]}\n\nUse this space to maintain the storefront copy from admin.`,
      seoTitle: titleMap[key],
      seoDescription: "Manage your HRUSHE content centrally from the admin dashboard.",
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
        label: "Summer capsule",
        title: "Modern layers, cut with restraint.",
        subtitle: "Launch premium hero stories across desktop and mobile with the same quiet luxury tone as the storefront.",
        ctaText: "Shop new arrivals",
        ctaLink: "/new-in",
        desktopImage: "/uploads/banners/banner1.png",
        mobileImage: "/uploads/banners/banner1.png",
        enabled: true,
        scheduleStart: null,
        scheduleEnd: null,
      },
      {
        id: "banner-02",
        label: "Weekend edit",
        title: "Oversized silhouettes for off-duty dressing.",
        subtitle: "Use scheduling to line up drops, campaigns, and editorial homepage swaps without touching code.",
        ctaText: "View collection",
        ctaLink: "/shop",
        desktopImage: "/uploads/banners/banner2.png",
        mobileImage: "/uploads/banners/banner2.png",
        enabled: true,
        scheduleStart: null,
        scheduleEnd: null,
      },
    ],
    lastPublishedAt: timestamp(),
  },
  productMeta: {},
  orderMeta: {},
  customerMeta: {},
  coupons: [
    {
      id: "coupon-launch-10",
      code: "HRUSHE10",
      title: "Launch welcome",
      type: "percentage",
      value: 10,
      expiresAt: timestamp(30),
      usageLimit: 250,
      usedCount: 18,
      active: true,
      customerEmail: "",
    },
  ],
  contentPages: defaultContentPages,
  mediaLibrary: [
    {
      id: "media-banner-01",
      name: "Hero campaign 01",
      url: "/uploads/banners/banner1.png",
      folder: "Banner Assets",
      tags: ["homepage", "desktop"],
      createdAt: timestamp(-3),
    },
    {
      id: "media-banner-02",
      name: "Hero campaign 02",
      url: "/uploads/banners/banner2.png",
      folder: "Banner Assets",
      tags: ["homepage", "mobile"],
      createdAt: timestamp(-1),
    },
  ],
  reviewModeration: {},
  websiteSettings: {
    brandName: "HRUSHE",
    logoUrl: "/hrushelogo.svg",
    faviconUrl: "/icon.svg",
    contactEmail: "team@hrushe.in",
    contactPhone: "+91 90000 00000",
    supportWhatsapp: "+91 90000 00000",
    instagramUrl: "https://instagram.com/hrushe",
    facebookUrl: "https://facebook.com/hrushe",
    pinterestUrl: "https://pinterest.com/hrushe",
    seoTitle: "HRUSHE | Elevated essentials",
    seoDescription: "Luxury minimal clothing for modern wardrobes.",
    analyticsId: "",
    metaPixelId: "",
    maintenanceMode: false,
  },
  roles: [
    {
      id: "role-super-admin",
      name: "Super Admin",
      description: "Full control over storefront, operations, reporting, and settings.",
      permissions: [...adminPermissionCatalog],
    },
    {
      id: "role-product-manager",
      name: "Product Manager",
      description: "Owns catalog launches, homepage edits, media, and review presentation.",
      permissions: [
        "dashboard.view",
        "home.manage",
        "products.view",
        "products.edit",
        "content.manage",
        "media.manage",
        "reviews.manage",
        "reports.view",
      ],
    },
    {
      id: "role-order-manager",
      name: "Order Manager",
      description: "Handles fulfillment, shipping, refunds, and order operations.",
      permissions: [
        "dashboard.view",
        "orders.view",
        "orders.manage",
        "shipping.manage",
        "reports.view",
      ],
    },
    {
      id: "role-customer-support",
      name: "Customer Support",
      description: "Supports customers, reviews, and account status operations.",
      permissions: [
        "dashboard.view",
        "customers.view",
        "customers.manage",
        "orders.view",
        "reviews.manage",
      ],
    },
  ],
  shipping: {
    defaultCourierPartner: "Delhivery",
    supportEmail: "support@hrushe.in",
    returnPickupPartner: "Delhivery Reverse",
    deliveryUpdateTemplate: "Your order is on the move. Track every handoff from dispatch to doorstep.",
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
    status: current?.status || product.status || deriveFallbackProductStatus(product),
    fitType: current?.fitType || product.fitType || "Regular",
    gender: current?.gender || product.gender || "Unisex",
    collectionLabels:
      current?.collectionLabels ||
      product.collectionLabels ||
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

