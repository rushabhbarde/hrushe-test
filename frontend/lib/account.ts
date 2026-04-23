import type { OrderRecord } from "@/lib/orders";

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
  | "contact-support";

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
  category: SupportCategory;
  orderId?: string;
  subject: string;
  message: string;
  status: "open" | "in-progress" | "resolved";
  resolutionNote?: string;
  createdAt: string;
  updatedAt: string;
};
