export const orderStatuses = [
  "Pending",
  "Confirmed",
  "Shipped",
  "Out for delivery",
  "Delivered",
  "Cancelled",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export type OrderProductSnapshot = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color?: string;
  image?: string;
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
  paymentMethod: string;
  paymentStatus: string;
  courierName?: string;
  trackingId?: string;
  trackingUrl?: string;
  orderStatus: OrderStatus;
  totalAmount: number;
  products: OrderProductSnapshot[];
  createdAt: string;
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
