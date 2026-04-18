const Cart = require("../models/Cart");
const Order = require("../models/Order");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const env = require("../config/env");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { sendEmail } = require("../utils/mailer");

const allowedStatuses = [
  "Pending",
  "Confirmed",
  "Shipped",
  "Out for delivery",
  "Delivered",
  "Cancelled",
];

const buildTrackingTimeline = (order) => {
  const baseSteps = [
    { key: "placed", label: "Order placed", status: "completed" },
    { key: "confirmed", label: "Confirmed", status: "upcoming" },
    { key: "shipped", label: "Shipped", status: "upcoming" },
    { key: "out-for-delivery", label: "Out for delivery", status: "upcoming" },
    { key: "delivered", label: "Delivered", status: "upcoming" },
  ];

  const statusIndexMap = {
    Pending: 0,
    Confirmed: 1,
    Shipped: 2,
    "Out for delivery": 3,
    Delivered: 4,
  };

  if (order.orderStatus === "Cancelled") {
    return [
      { key: "placed", label: "Order placed", status: "completed" },
      { key: "cancelled", label: "Cancelled", status: "current" },
    ];
  }

  const activeIndex = statusIndexMap[order.orderStatus] ?? 0;

  return baseSteps.map((step, index) => ({
    ...step,
    status:
      index < activeIndex
        ? "completed"
        : index === activeIndex
          ? "current"
          : "upcoming",
  }));
};

const buildPublicTrackingResponse = (order) => ({
  id: order.id || order._id.toString(),
  orderNumber: order.orderNumber || null,
  customerName: order.customerName,
  customerEmail: order.customerEmail,
  customerPhone: order.customerPhone,
  paymentStatus: order.paymentStatus,
  orderStatus: order.orderStatus,
  shippingAddress: order.shippingAddress,
  courierName: order.courierName,
  trackingId: order.trackingId,
  trackingUrl: order.trackingUrl,
  totalAmount: order.totalAmount,
  products: order.products,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  timeline: buildTrackingTimeline(order),
});

const sanitizeCartItems = (items = []) =>
  items
    .filter((item) => item && item.productId && item.name && Number(item.quantity) > 0)
    .map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity),
      size: item.size || "",
      color: item.color || "",
      price: Number(item.price),
      name: item.name,
      image: item.image || "",
    }));

const buildRedirectUrl = (path, orderId) =>
  `${env.CLIENT_URL}${path}?orderId=${encodeURIComponent(orderId)}`;

const getRazorpayClient = () => {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new AppError("Razorpay is not configured", 500);
  }

  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
};

const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return expectedSignature === signature;
};

const findOrderByReference = async (orderReference) => {
  const normalized = String(orderReference || "").trim();

  if (!normalized) {
    return null;
  }

  if (/^\d+$/.test(normalized)) {
    const orderByNumber = await Order.findOne({ orderNumber: Number(normalized) });

    if (orderByNumber) {
      return orderByNumber;
    }
  }

  return Order.findById(normalized);
};

const recordCheckoutLog = (order, event, source, payload = {}) => {
  order.checkoutLogs.push({
    event,
    source,
    payload,
  });
};

const sendOrderEmail = async (order, subject, summaryLine) => {
  if (!order.customerEmail) {
    return;
  }

  const itemsHtml = order.products
    .map(
      (item) =>
        `<li>${item.name} x ${item.quantity}${item.size ? ` • Size ${item.size}` : ""}${item.color ? ` • ${item.color}` : ""}</li>`
    )
    .join("");

  await sendEmail({
    to: order.customerEmail,
    subject,
    text: `${summaryLine}\nOrder #${order.orderNumber || order._id.toString()}\nTotal: Rs. ${order.totalAmount}`,
    html: `
      <p>${summaryLine}</p>
      <p><strong>Order #${order.orderNumber || order._id.toString()}</strong></p>
      <p>Total: <strong>Rs. ${order.totalAmount}</strong></p>
      <ul>${itemsHtml}</ul>
      ${
        order.trackingId || order.trackingUrl
          ? `<p>Tracking ID: ${order.trackingId || "-"}</p>${
              order.trackingUrl ? `<p><a href="${order.trackingUrl}">Track shipment</a></p>` : ""
            }`
          : ""
      }
    `,
  });
};

const placeOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod } = req.body;

  if (!shippingAddress || !paymentMethod) {
    throw new AppError("Shipping address and payment method are required", 400);
  }

  const cart = await Cart.findOne({ userId: req.user._id }).populate(
    "items.productId"
  );

  if (!cart || cart.items.length === 0) {
    throw new AppError("Cart is empty", 400);
  }

  const products = cart.items.map((item) => ({
    productId: item.productId._id,
    quantity: item.quantity,
    size: item.size,
    color: item.color || "",
    price: item.productId.price,
    name: item.productId.name,
    image: item.productId.images[0] || "",
  }));

  const totalAmount = products.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const order = await Order.create({
    userId: req.user._id,
    products,
    totalAmount,
    shippingAddress,
    customerName: req.user.name,
    customerEmail: req.user.email,
    customerPhone: req.user.phone,
    paymentMethod,
  });

  cart.items = [];
  await cart.save();

  return res.status(201).json(order);
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ userId: req.user._id }).sort({
    createdAt: -1,
  });

  return res.json(orders);
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    "userId",
    "name email phone address"
  );

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  const isOwner = order.userId?._id?.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    throw new AppError("Not authorized to view this order", 403);
  }

  return res.json(order);
});

const trackOrder = asyncHandler(async (req, res) => {
  const { orderId, email, phone } = req.body;

  if (!orderId) {
    throw new AppError("Order id is required", 400);
  }

  if (!email && !phone) {
    throw new AppError("Email or phone is required", 400);
  }

  const order = await findOrderByReference(orderId);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const normalizedPhone = String(phone || "")
    .trim();

  const matchesEmail =
    normalizedEmail && order.customerEmail.toLowerCase() === normalizedEmail;
  const matchesPhone =
    normalizedPhone && String(order.customerPhone || "").trim() === normalizedPhone;

  if (!matchesEmail && !matchesPhone) {
    throw new AppError("Order lookup details do not match", 403);
  }

  return res.json(buildPublicTrackingResponse(order));
});

const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate("userId", "name email phone address")
    .sort({ createdAt: -1 });

  return res.json(orders);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus, trackingId, courierName, trackingUrl } = req.body;

  const update = {};

  if (orderStatus !== undefined && !allowedStatuses.includes(orderStatus)) {
    throw new AppError("Invalid order status", 400);
  }

  if (orderStatus !== undefined) {
    update.orderStatus = orderStatus;
  }

  if (trackingId !== undefined) {
    update.trackingId = String(trackingId || "").trim();
  }

  if (courierName !== undefined) {
    update.courierName = String(courierName || "").trim();
  }

  if (trackingUrl !== undefined) {
    update.trackingUrl = String(trackingUrl || "").trim();
  }

  const order = await Order.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (
    orderStatus !== undefined ||
    trackingId !== undefined ||
    courierName !== undefined ||
    trackingUrl !== undefined
  ) {
    await sendOrderEmail(
      order,
      `Your HRUSHE order is now ${order.orderStatus}`,
      `Your order status has been updated to ${order.orderStatus}.`
    );
  }

  return res.json(order);
});

const createCheckout = asyncHandler(async (req, res) => {
  const { shippingInfo, items } = req.body;

  if (!shippingInfo) {
    throw new AppError("Shipping information is required", 400);
  }

  const { fullName, email, phone, address, paymentMethod = "Razorpay" } = shippingInfo;

  if (!fullName || !email || !phone || !address) {
    throw new AppError("Full name, email, phone, and address are required", 400);
  }

  const normalizedItems = sanitizeCartItems(items);

  if (normalizedItems.length === 0) {
    throw new AppError("Cart is empty", 400);
  }

  const totalAmount = normalizedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const razorpay = getRazorpayClient();
  let razorpayOrder;

  try {
    razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: env.RAZORPAY_CURRENCY,
      receipt: `hrushe_${Date.now().toString(36)}`,
      notes: {
        customerName: fullName,
        customerEmail: email,
        customerPhone: phone,
      },
    });
  } catch (error) {
    console.error("Razorpay order creation failed", {
      message:
        error?.error?.description ||
        error?.description ||
        error?.message ||
        "Unknown Razorpay error",
      code: error?.error?.code || error?.code,
      field: error?.error?.field,
      source: error?.error?.source,
      step: error?.error?.step,
      reason: error?.error?.reason,
      statusCode: error?.statusCode || error?.error?.statusCode,
      metadata: error?.error?.metadata,
    });

    throw new AppError(
      error?.error?.description ||
        error?.description ||
        "Could not create Razorpay order. Please verify Razorpay keys and account setup.",
      502
    );
  }

  const order = await Order.create({
    userId: req.user._id,
    products: normalizedItems,
    totalAmount,
    shippingAddress: address,
    customerName: fullName,
    customerEmail: email,
    customerPhone: phone,
    paymentMethod,
    paymentStatus: "initiated",
    checkoutProvider: "razorpay",
    checkoutSessionId: razorpayOrder.id,
    checkoutUrl: "",
    checkoutLogs: [
      {
        event: "checkout_created",
        source: "backend",
        payload: {
          shippingInfo: { fullName, email, phone, address },
          items: normalizedItems,
          razorpayOrderId: razorpayOrder.id,
        },
      },
    ],
  });
  await order.save();

  return res.status(201).json({
    appOrderId: order.id,
    orderId: order.orderNumber || order.id,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    key: env.RAZORPAY_KEY_ID,
    customer: {
      name: fullName,
      email,
      phone,
    },
    paymentStatus: order.paymentStatus,
    mode: "provider",
  });
});

const verifyCheckout = asyncHandler(async (req, res) => {
  const {
    appOrderId,
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature,
  } = req.body;

  if (!appOrderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new AppError("Razorpay verification details are required", 400);
  }

  const order = await Order.findById(appOrderId);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.checkoutSessionId !== razorpayOrderId) {
    throw new AppError("Checkout session mismatch", 400);
  }

  const isValidSignature = verifyRazorpaySignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });

  if (!isValidSignature) {
    throw new AppError("Invalid Razorpay payment signature", 400);
  }

  order.paymentStatus = "paid";
  order.orderStatus = "Confirmed";
  order.checkoutUrl = "";
  recordCheckoutLog(order, "razorpay_payment_verified", "backend", {
    razorpayOrderId,
    razorpayPaymentId,
  });
  await order.save();
  await sendOrderEmail(
    order,
    "Your HRUSHE order is confirmed",
    "Thank you for shopping with HRUSHE. Your order has been confirmed."
  );

  return res.json({
    success: true,
    redirectUrl: buildRedirectUrl(
      "/checkout/success",
      String(order.orderNumber || order._id.toString())
    ),
  });
});

const failCheckout = asyncHandler(async (req, res) => {
  const { orderId } = req.query;

  if (!orderId) {
    throw new AppError("Order id is required", 400);
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  order.paymentStatus = "failed";
  recordCheckoutLog(order, "checkout_failure_return", "redirect", req.query);
  await order.save();

  return res.redirect(
    buildRedirectUrl("/checkout/failure", String(order.orderNumber || order._id.toString()))
  );
});

const cancelCheckout = asyncHandler(async (req, res) => {
  const { orderId } = req.query;

  if (!orderId) {
    throw new AppError("Order id is required", 400);
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  order.paymentStatus = "cancelled";
  order.orderStatus = "Cancelled";
  recordCheckoutLog(order, "checkout_cancel_return", "redirect", req.query);
  await order.save();

  return res.redirect(
    buildRedirectUrl("/checkout/failure", String(order.orderNumber || order._id.toString()))
  );
});

const razorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];

  if (env.RAZORPAY_WEBHOOK_SECRET && signature) {
    const expectedSignature = crypto
      .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (expectedSignature !== signature) {
      throw new AppError("Invalid webhook signature", 401);
    }
  }

  const event = String(req.body.event || "");
  const paymentEntity = req.body.payload?.payment?.entity;
  const razorpayOrderId = paymentEntity?.order_id;

  if (!razorpayOrderId) {
    return res.json({ received: true });
  }

  const order = await Order.findOne({ checkoutSessionId: razorpayOrderId });

  if (!order) {
    return res.json({ received: true });
  }

  if (event === "payment.captured") {
    order.paymentStatus = "paid";
    order.orderStatus = "Confirmed";
  } else if (event === "payment.failed") {
    order.paymentStatus = "failed";
  }

  recordCheckoutLog(order, "razorpay_webhook_received", "webhook", req.body);
  await order.save();

  return res.json({ received: true });
});

module.exports = {
  placeOrder,
  getMyOrders,
  getOrderById,
  trackOrder,
  getAllOrders,
  updateOrderStatus,
  createCheckout,
  verifyCheckout,
  failCheckout,
  cancelCheckout,
  razorpayWebhook,
};
