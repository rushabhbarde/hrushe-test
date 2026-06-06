import type { Product, ProductStatus } from "@/lib/catalog";
import type { OrderRecord } from "@/lib/orders";
import type { AdminPermission, AdminRoleId } from "@/lib/admin-workspace";
import type { SupportCategory } from "@/lib/account";
import type {
  AddressRecord,
  AccountPreferences,
  CommunicationPreferences,
  WishlistProduct,
} from "@/lib/account";

export type AdminNavItem = {
  label: string;
  href: string;
  group: string;
  description?: string;
  permission?: AdminPermission;
};

export type AdminMetric = {
  label: string;
  value: string;
  detail?: string;
  tone?: "default" | "accent" | "success" | "warning";
};

export type AdminCustomer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string | null;
  role: string;
  profilePictureUrl?: string;
  address?: string;
  addresses: AddressRecord[];
  preferences: AccountPreferences;
  communicationPreferences: CommunicationPreferences;
  wishlist: WishlistProduct[];
  createdAt: string;
  updatedAt?: string;
  orderCount: number;
  totalSpend: number;
  averageOrderValue: number;
  lastOrderDate?: string | null;
  status: "New" | "Active" | "VIP" | "At Risk";
  notes?: string[];
};

export type AdminCustomerDetail = AdminCustomer & {
  orders: OrderRecord[];
};

export type AdminSupportRequest = {
  id: string;
  _id?: string;
  ticketNumber?: number;
  ticketCode?: string;
  category: SupportCategory;
  source?: "chatbot" | "account" | "admin";
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  assignedRole?: AdminRoleId | "";
  subject: string;
  message: string;
  status: "open" | "in-progress" | "waiting-customer" | "resolved";
  resolutionNote?: string;
  transcript?: Array<{
    role: "bot" | "customer" | "system";
    message: string;
    createdAt?: string;
    updatedAt?: string;
  }>;
  createdAt: string;
  updatedAt?: string;
  userId?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  orderId?: string;
};

export const adminNavigation: AdminNavItem[] = [
  { group: "Dashboard", label: "Overview", href: "/admin", permission: "dashboard.view" },
  { group: "Storefront", label: "Home management", href: "/admin/homepage", permission: "home.manage" },
  { group: "Catalog", label: "Products", href: "/admin/products", permission: "products.view" },
  { group: "Operations", label: "Orders", href: "/admin/orders", permission: "orders.view" },
  { group: "Operations", label: "Shipping", href: "/admin/shipping", permission: "shipping.manage" },
  { group: "Operations", label: "Returns", href: "/admin/returns", permission: "support.manage" },
  { group: "Operations", label: "Support", href: "/admin/support", permission: "support.manage" },
  { group: "Customers", label: "Customers", href: "/admin/customers", permission: "customers.view" },
  { group: "Marketing", label: "Coupons & promos", href: "/admin/coupons", permission: "coupons.manage" },
  { group: "Content", label: "Content", href: "/admin/content", permission: "content.manage" },
  { group: "Content", label: "Media library", href: "/admin/media", permission: "media.manage" },
  { group: "Content", label: "Reviews", href: "/admin/reviews", permission: "reviews.manage" },
  { group: "Reports", label: "Reports", href: "/admin/reports", permission: "reports.view" },
  { group: "Settings", label: "Website settings", href: "/admin/settings", permission: "settings.manage" },
  { group: "Settings", label: "Roles & permissions", href: "/admin/roles", permission: "roles.manage" },
];

const adminRoutePermissions: Array<{ prefix: string; permission: AdminPermission }> = [
  { prefix: "/admin/add-product", permission: "products.edit" },
  { prefix: "/admin/products", permission: "products.view" },
  { prefix: "/admin/categories", permission: "products.edit" },
  { prefix: "/admin/collections", permission: "products.edit" },
  { prefix: "/admin/inventory", permission: "products.view" },
  { prefix: "/admin/orders", permission: "orders.view" },
  { prefix: "/admin/shipping", permission: "shipping.manage" },
  { prefix: "/admin/returns", permission: "support.manage" },
  { prefix: "/admin/support", permission: "support.manage" },
  { prefix: "/admin/customers", permission: "customers.view" },
  { prefix: "/admin/homepage", permission: "home.manage" },
  { prefix: "/admin/storefront", permission: "home.manage" },
  { prefix: "/admin/announcements", permission: "home.manage" },
  { prefix: "/admin/audience", permission: "coupons.manage" },
  { prefix: "/admin/coupons", permission: "coupons.manage" },
  { prefix: "/admin/content", permission: "content.manage" },
  { prefix: "/admin/media", permission: "media.manage" },
  { prefix: "/admin/reviews", permission: "reviews.manage" },
  { prefix: "/admin/reports", permission: "reports.view" },
  { prefix: "/admin/settings", permission: "settings.manage" },
  { prefix: "/admin/roles", permission: "roles.manage" },
];

export function getAdminRoutePermission(pathname: string): AdminPermission | undefined {
  if (pathname === "/admin") {
    return "dashboard.view";
  }

  return adminRoutePermissions
    .filter((route) => pathname === route.prefix || pathname.startsWith(`${route.prefix}/`))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0]?.permission;
}

export function formatAdminCurrency(value: number) {
  return `Rs. ${Math.round(value || 0).toLocaleString("en-IN")}`;
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0);
}

export function formatAdminDate(value?: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  }).format(new Date(value));
}

export function deriveProductStatus(product: Product, overrideStatus?: ProductStatus) {
  if (overrideStatus) {
    return overrideStatus;
  }

  if (product.status) {
    return product.status;
  }

  if (product.sizes.length === 0) {
    return "Sold Out";
  }

  const hasRequiredCatalogData =
    Boolean(product.name?.trim()) &&
    Boolean(product.category?.trim()) &&
    Boolean(product.description?.trim()) &&
    Boolean(product.images?.length) &&
    product.price > 0;

  if (!hasRequiredCatalogData) {
    return "Draft";
  }

  return "Active";
}

export function productStatusTone(status: ProductStatus) {
  switch (status) {
    case "Active":
      return "success";
    case "Hidden":
      return "accent";
    case "Sold Out":
      return "warning";
    default:
      return "default";
  }
}

export function orderStatusTone(status: string) {
  switch (status) {
    case "Delivered":
    case "Refunded":
    case "Refund completed":
      return "success";
    case "Cancelled":
    case "Returned":
      return "warning";
    case "Shipped":
    case "Out for delivery":
      return "accent";
    default:
      return "default";
  }
}

export function customerStatusTone(status: AdminCustomer["status"]) {
  switch (status) {
    case "VIP":
      return "accent";
    case "At Risk":
      return "warning";
    case "Active":
      return "success";
    default:
      return "default";
  }
}
