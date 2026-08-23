export const orderStatuses = [
  "Pending",
  "Confirmed",
  "Packed",
  "Shipped",
  "Out for delivery",
  "Delivered",
  "Cancelled",
  "Returned",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export const activeFulfillmentStatuses: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Packed",
  "Shipped",
  "Out for delivery",
  "Delivered",
];

const cancellableStatuses: OrderStatus[] = ["Pending", "Confirmed", "Packed"];
const paidFulfillmentStatuses: OrderStatus[] = [
  "Confirmed",
  "Packed",
  "Shipped",
  "Out for delivery",
  "Delivered",
];

export function canTransitionOrderStatus(currentStatus: OrderStatus, nextStatus: OrderStatus) {
  if (!nextStatus || currentStatus === nextStatus) {
    return true;
  }

  if (nextStatus === "Cancelled") {
    return cancellableStatuses.includes(currentStatus);
  }

  if (nextStatus === "Returned") {
    return currentStatus === "Delivered";
  }

  if (["Cancelled", "Returned", "Delivered"].includes(currentStatus)) {
    return false;
  }

  const currentIndex = activeFulfillmentStatuses.indexOf(currentStatus);
  const nextIndex = activeFulfillmentStatuses.indexOf(nextStatus);

  return currentIndex >= 0 && nextIndex > currentIndex;
}

export function requiresPaidOrderStatus(status: OrderStatus) {
  return paidFulfillmentStatuses.includes(status);
}

export type OrderProductSnapshot = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color?: string;
  fit?: string;
  image?: string;
};

export type ShippingAddressDetails = {
  label?: "Home" | "Work" | "Other";
  fullName?: string;
  mobile?: string;
  pincode?: string;
  city?: string;
  state?: string;
  house?: string;
  area?: string;
  landmark?: string;
};

export type OrderRecord = {
  id: string;
  orderNumber?: number | null;
  userId?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: string;
  shippingAddressDetails?: ShippingAddressDetails;
  paymentMethod: string;
  paymentStatus: string;
  courierName?: string;
  trackingId?: string;
  trackingUrl?: string;
  orderStatus: OrderStatus;
  totalAmount: number;
  products: OrderProductSnapshot[];
  createdAt: string;
  updatedAt?: string;
};

export type TrackingTimelineStep = {
  key: string;
  label: string;
  status: "completed" | "current" | "upcoming";
};

export type PublicTrackingRecord = {
  id: string;
  orderNumber?: number | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  paymentStatus: string;
  orderStatus: OrderStatus;
  shippingAddress: string;
  courierName?: string;
  trackingId?: string;
  trackingUrl?: string;
  totalAmount: number;
  products: OrderProductSnapshot[];
  createdAt: string;
  updatedAt?: string;
  timeline: TrackingTimelineStep[];
};

export function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
