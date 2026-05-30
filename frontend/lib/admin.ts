import type { Product, ProductStatus } from "@/lib/catalog";
import type { OrderRecord } from "@/lib/orders";
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
  category: string;
  subject: string;
  message: string;
  status: string;
  resolutionNote?: string;
  createdAt: string;
  updatedAt?: string;
  userId?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  orderId?: {
    id?: string;
    orderNumber?: number | null;
  };
};

export const adminNavigation: AdminNavItem[] = [
  { group: "Dashboard", label: "Overview", href: "/admin" },
  { group: "Storefront", label: "Home management", href: "/admin/homepage" },
  { group: "Catalog", label: "Products", href: "/admin/products" },
  { group: "Operations", label: "Orders", href: "/admin/orders" },
  { group: "Operations", label: "Shipping", href: "/admin/shipping" },
  { group: "Customers", label: "Customers", href: "/admin/customers" },
  { group: "Marketing", label: "Coupons & promos", href: "/admin/coupons" },
  { group: "Content", label: "Content", href: "/admin/content" },
  { group: "Content", label: "Media library", href: "/admin/media" },
  { group: "Content", label: "Reviews", href: "/admin/reviews" },
  { group: "Reports", label: "Reports", href: "/admin/reports" },
  { group: "Settings", label: "Website settings", href: "/admin/settings" },
  { group: "Settings", label: "Roles & permissions", href: "/admin/roles" },
];

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
