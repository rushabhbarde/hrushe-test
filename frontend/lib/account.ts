import type { OrderRecord } from "@/lib/orders";
import type { AdminPermission, AdminRoleId } from "@/lib/admin-workspace";

export type AddressRecord = {
  id: string;
  label: "Home" | "Work" | "Other";
  fullName: string;
  mobile: string;
  pincode: string;
  city: string;
  state: string;
  house: string;
  area: string;
  landmark: string;
  isDefault: boolean;
};

export type AccountPreferences = {
  preferredSize: string;
  preferredFit: "" | "Oversize" | "Regular";
  favoriteColors: string[];
};

export type CommunicationPreferences = {
  emailNotifications: boolean;
  whatsappOrderUpdates: boolean;
  marketingMessages: boolean;
};

export type AccountUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gender: string;
  dateOfBirth: string | null;
  profilePictureUrl: string;
  isVerified: boolean;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  role: string;
  adminRole?: AdminRoleId | "";
  adminRoleName?: string;
  adminPermissions?: AdminPermission[];
  addresses: AddressRecord[];
  preferences: AccountPreferences;
  communicationPreferences: CommunicationPreferences;
  wishlistCount: number;
};

export type WishlistProduct = {
  id: string;
  name: string;
  slug?: string;
  price: number;
  compareAtPrice?: number | null;
  category: string;
  categories?: string[];
  sizes: string[];
  colors: string[];
  images: string[];
  featured?: boolean;
  bestSeller?: boolean;
  newIn?: boolean;
  newArrival?: boolean;
};

export type AccountSummary = {
  user: AccountUser;
  counts: {
    orders: number;
    addresses: number;
    wishlist: number;
  };
  recentOrders: OrderRecord[];
};

export type SupportCategory =
  | "track-order"
  | "return-request"
  | "exchange-request"
  | "login-help"
  | "signup-help"
  | "payment-refund"
  | "product-size"
  | "coupon-sale"
  | "website-issue"
  | "contact-support"
  | "other";

export type SupportRequestRecord = {
  id?: string;
  _id?: string;
  userId?: {
    id?: string;
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  ticketNumber?: number;
  ticketCode?: string;
  category: SupportCategory;
  source?: "chatbot" | "account" | "admin";
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  orderId?: string;
  subject: string;
  message: string;
  status: "open" | "in-progress" | "waiting-customer" | "resolved";
  priority?: "low" | "normal" | "high" | "urgent";
  assignedRole?: "" | "super-admin" | "brand-growth-manager" | "operations-manager" | "catalog-manager";
  resolutionNote?: string;
  transcript?: Array<{
    role: "bot" | "customer" | "system";
    message: string;
    createdAt?: string;
    updatedAt?: string;
  }>;
  createdAt: string;
  updatedAt: string;
};
