const env = require("../config/env");
const { logEvent } = require("../utils/logger");

const API = "https://apiv2.shiprocket.in/v1/external";
const tokenCache = { token: "", expiresAt: 0 };

function isShiprocketConfigured() {
  return Boolean(env.SHIPROCKET_EMAIL && env.SHIPROCKET_PASSWORD);
}

async function getToken({ fetchImpl = fetch } = {}) {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const response = await fetchImpl(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: env.SHIPROCKET_EMAIL, password: env.SHIPROCKET_PASSWORD }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.token) {
    throw new Error(`Shiprocket login failed (${response.status}): ${body.message || "no token"}`);
  }

  // Shiprocket tokens last 10 days; refresh a day early.
  tokenCache.token = body.token;
  tokenCache.expiresAt = Date.now() + 9 * 24 * 60 * 60 * 1000;
  return tokenCache.token;
}

function formatOrderDate(date) {
  const d = new Date(date || Date.now());
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function rupees(order, paiseKey, rupeeKey) {
  const paise = Number(order[paiseKey]);
  return Number.isFinite(paise) && paise > 0 ? paise / 100 : Number(order[rupeeKey] || 0);
}

/** Our order → Shiprocket "adhoc" order payload (prepaid; we collect payment via Razorpay). */
function buildShiprocketOrderPayload(order) {
  const address = order.shippingAddressDetails || {};
  const [length, breadth, height] = String(env.SHIPROCKET_PACKAGE_CM).split("x").map((value) => Number(value) || 1);
  const phone = String(address.mobile || order.customerPhone || "").replace(/\D/g, "").slice(-10);
  const fullName = String(address.fullName || order.customerName || "").trim();
  const [firstName, ...rest] = fullName.split(/\s+/);

  const items = (order.products || []).map((product) => ({
    name: [product.name, product.size, product.color].filter(Boolean).join(" · ").slice(0, 200),
    sku: String(product.sku || `${product.productId}-${product.size || "OS"}`).slice(0, 50),
    units: Number(product.quantity) || 1,
    selling_price: Number(product.pricePaise) > 0 ? Number(product.pricePaise) / 100 : Number(product.price) || 0,
    discount: 0,
    tax: 0,
    hsn: "",
  }));

  return {
    order_id: String(order.orderNumber || order._id),
    order_date: formatOrderDate(order.paymentCapturedAt || order.createdAt),
    pickup_location: env.SHIPROCKET_PICKUP_LOCATION,
    billing_customer_name: firstName || fullName || "Customer",
    billing_last_name: rest.join(" "),
    billing_address: String(address.house || order.shippingAddress || "").slice(0, 190),
    billing_address_2: [address.area, address.landmark].filter(Boolean).join(", ").slice(0, 190),
    billing_city: address.city || "",
    billing_pincode: String(address.pincode || ""),
    billing_state: address.state || "",
    billing_country: "India",
    billing_email: order.customerEmail || "",
    billing_phone: phone,
    shipping_is_billing: true,
    order_items: items,
    payment_method: "Prepaid",
    shipping_charges: rupees(order, "shippingPaise", "shippingAmount"),
    total_discount: rupees(order, "discountPaise", "discountAmount"),
    sub_total: rupees(order, "totalPaise", "totalAmount"),
    length,
    breadth,
    height,
    weight: env.SHIPROCKET_PACKAGE_WEIGHT_KG,
  };
}

async function createShiprocketOrder(order, { fetchImpl = fetch } = {}) {
  const token = await getToken({ fetchImpl });
  const payload = buildShiprocketOrderPayload(order);
  const response = await fetchImpl(`${API}/orders/create/adhoc`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));

  if (response.status === 401) {
    tokenCache.token = "";
  }
  if (!response.ok || !body.order_id) {
    const details = body.errors ? JSON.stringify(body.errors) : body.message || `HTTP ${response.status}`;
    throw new Error(`Shiprocket rejected the order: ${details}`.slice(0, 500));
  }

  logEvent("shiprocket.order.created", { orderId: String(order._id), shiprocketOrderId: body.order_id });
  return {
    orderId: String(body.order_id),
    shipmentId: String(body.shipment_id || ""),
    awbCode: String(body.awb_code || ""),
    status: String(body.status || ""),
  };
}

/** Shiprocket tracking status → our order status (forward moves only are applied by the caller). */
function mapShiprocketStatus(status) {
  const value = String(status || "").trim().toUpperCase();
  if (value === "DELIVERED") return "Delivered";
  if (value === "OUT FOR DELIVERY") return "Out for delivery";
  if (["PICKED UP", "SHIPPED", "IN TRANSIT", "REACHED AT DESTINATION HUB", "OUT FOR PICKUP"].includes(value)) {
    return value === "OUT FOR PICKUP" ? "Packed" : "Shipped";
  }
  return "";
}

function resetShiprocketTokenForTests() {
  tokenCache.token = "";
  tokenCache.expiresAt = 0;
}

module.exports = {
  buildShiprocketOrderPayload,
  createShiprocketOrder,
  isShiprocketConfigured,
  mapShiprocketStatus,
  resetShiprocketTokenForTests,
};
