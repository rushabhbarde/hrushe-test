/**
 * The journey of an order through the atelier. The status is what is stored and what the
 * team sees in Atelier; customers read the atelier's word for it (see orderStageWords). The
 * backend keeps the same list in backend/src/config/orderStages.js.
 */
export const orderStatuses = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Quality check",
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
  "Preparing",
  "Quality check",
  "Packed",
  "Shipped",
  "Out for delivery",
  "Delivered",
];

/** Paid and still in the atelier: not yet handed to the courier. */
export const inAtelierStatuses: OrderStatus[] = ["Confirmed", "Preparing", "Quality check", "Packed"];

/** What the customer reads for each stage. */
export const orderStageWords: Record<OrderStatus, string> = {
  Pending: "Placed",
  Confirmed: "Received",
  Preparing: "On the table",
  "Quality check": "Inspected",
  Packed: "Wrapped",
  Shipped: "On its way",
  "Out for delivery": "Nearly home",
  Delivered: "Home",
  Cancelled: "Cancelled",
  Returned: "Returned",
};

export function getOrderStageWord(status: string) {
  return orderStageWords[status as OrderStatus] || status;
}

// An order can be cancelled until it is handed to the courier.
const cancellableStatuses: OrderStatus[] = ["Pending", ...inAtelierStatuses];
const paidFulfillmentStatuses: OrderStatus[] = activeFulfillmentStatuses.filter((status) => status !== "Pending");

/** Customers can cancel their own order until it ships. */
export function canCustomerCancelOrder(status: OrderStatus) {
  return cancellableStatuses.includes(status);
}

/** Returns and the free size exchange are open for 7 days after delivery. */
export const RETURN_WINDOW_DAYS = 7;

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

type ShippingAddressDetails = {
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
  deliveredAt?: string | null;
  callConfirmedAt?: string | null;
  callConfirmedBy?: string;
  couponCode?: string;
  couponKind?: "" | "welcome" | "referral" | "stored";
  discountPaise?: number;
  gift?: { wrap?: boolean; note?: string };
  shiprocket?: {
    status?: "" | "sending" | "created" | "failed";
    orderId?: string;
    shipmentId?: string;
    awbCode?: string;
    lastStatus?: string;
    error?: string;
  };
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
