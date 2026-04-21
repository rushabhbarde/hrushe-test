import type { Product } from "@/lib/catalog";
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
  { group: "Commerce", label: "Orders", href: "/admin/orders" },
  { group: "Commerce", label: "Returns & refunds", href: "/admin/returns" },
  { group: "Commerce", label: "Customers", href: "/admin/customers" },
  { group: "Catalog", label: "Products", href: "/admin/products" },
  { group: "Catalog", label: "Categories", href: "/admin/categories" },
  { group: "Catalog", label: "Collections", href: "/admin/collections" },
  { group: "Catalog", label: "Inventory", href: "/admin/inventory" },
  { group: "Marketing", label: "Coupons", href: "/admin/coupons" },
  { group: "Marketing", label: "Audience", href: "/admin/audience" },
  { group: "Marketing", label: "Reviews", href: "/admin/reviews" },
  { group: "Storefront", label: "Homepage control", href: "/admin/storefront" },
  { group: "Storefront", label: "Banners", href: "/admin/homepage" },
  { group: "Storefront", label: "Announcements", href: "/admin/announcements" },
  { group: "Support", label: "Tickets", href: "/admin/support" },
  { group: "Reports", label: "Sales reports", href: "/admin/reports/sales" },
  { group: "Reports", label: "Order reports", href: "/admin/reports/orders" },
  { group: "Reports", label: "Customer reports", href: "/admin/reports/customers" },
  { group: "Reports", label: "Product reports", href: "/admin/reports/products" },
  { group: "Settings", label: "General", href: "/admin/settings/general" },
  { group: "Settings", label: "Notifications", href: "/admin/settings/notifications" },
  { group: "Settings", label: "Roles & permissions", href: "/admin/settings/roles" },
  { group: "Settings", label: "Integrations", href: "/admin/settings/integrations" },
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

export function deriveProductStatus(product: Product) {
  if (!product.images?.length || !product.sizes?.length) {
    return "Draft";
  }

  if (product.sizes.length === 0) {
    return "Out of Stock";
  }

  if (!product.featured && !product.newArrival && !product.newIn && !product.bestSeller) {
    return "Active";
  }

  return "Active";
}

export function orderStatusTone(status: string) {
  switch (status) {
    case "Delivered":
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
