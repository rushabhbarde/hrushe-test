const Cart = require("../models/Cart");
const Order = require("../models/Order");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const env = require("../config/env");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { sendEmail } = require("../utils/mailer");
const { buildOrderStatusEmail } = require("../utils/emailTemplates");
const { buildInvoicePdf } = require("../utils/invoicePdf");
const { hasAdminPermission } = require("../config/adminRoles");
const WebhookEvent = require("../models/WebhookEvent");
const { recordAuditLog } = require("../utils/auditLog");
const {
  RESERVATION_WINDOW_MS,
  resolveCheckoutItems,
  reserveInventory,
  releaseInventoryItems,
  commitOrderInventory,
  releaseOrderInventory,
} = require("../services/checkoutInventory");

const allowedStatuses = [
  "Pending",
  "Confirmed",
  "Packed",
  "Shipped",
  "Out for delivery",
  "Delivered",
  "Cancelled",
  "Returned",
];

const buildTrackingTimeline = (order) => {
  const baseSteps = [
    { key: "placed", label: "Order placed", status: "completed" },
    { key: "confirmed", label: "Confirmed", status: "upcoming" },
    { key: "packed", label: "Packed", status: "upcoming" },
    { key: "shipped", label: "Shipped", status: "upcoming" },
    { key: "out-for-delivery", label: "Out for delivery", status: "upcoming" },
    { key: "delivered", label: "Delivered", status: "upcoming" },
  ];

  const statusIndexMap = {
    Pending: 0,
    Confirmed: 1,
    Packed: 2,
    Shipped: 3,
    "Out for delivery": 4,
    Delivered: 5,
  };

  if (order.orderStatus === "Cancelled") {
    return [
      { key: "placed", label: "Order placed", status: "completed" },
      { key: "cancelled", label: "Cancelled", status: "current" },
    ];
  }

  if (order.orderStatus === "Returned") {
    return [
      { key: "placed", label: "Order placed", status: "completed" },
      { key: "returned", label: "Returned", status: "current" },
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

const getCartItemProductId = (item) =>
  item?.productId?._id?.toString?.() || item?.productId?.toString?.() || "";

const buildCustomerOrderProducts = (products = []) =>
  products.map((item) => ({
    productId: item.productId?.toString?.() || String(item.productId || ""),
    quantity: item.quantity,
    size: item.size || "",
    color: item.color || "",
    fit: item.fit || "",
    price: item.price,
    name: item.name,
    image: item.image || "",
  }));

const buildPublicTrackingResponse = (order) => ({
  id: order.id || order._id.toString(),
  orderNumber: order.orderNumber || null,
  orderNumber: order.orderNumber || null,
  customerName: order.customerName,
  customerEmail: order.customerEmail,
  customerPhone: order.customerPhone,
  paymentStatus: order.paymentStatus,
  orderStatus: order.orderStatus,
  shippingAddress: order.shippingAddress,
  shippingAddressDetails: order.shippingAddressDetails,
  paymentMethod: order.paymentMethod,
  courierName: order.courierName,
  trackingId: order.trackingId,
  trackingUrl: order.trackingUrl,
  totalAmount: order.totalAmount,
  products: buildCustomerOrderProducts(order.products),
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  timeline: buildTrackingTimeline(order),
});

const cleanShippingText = (value, maxLength = 160) =>
  String(value || "").trim().slice(0, maxLength);

const normalizeShippingAddress = (shippingInfo = {}) => {
  if (typeof shippingInfo.address === "string") {
    return {
      shippingAddress: shippingInfo.address.trim(),
      shippingAddressDetails: {
        label: "Home",
        fullName: cleanShippingText(shippingInfo.fullName, 100),
        mobile: cleanShippingText(shippingInfo.phone, 20),
        pincode: "",
        city: "",
        state: "",
        house: cleanShippingText(shippingInfo.address, 240),
        area: "",
        landmark: "",
      },
    };
  }

  const addressDetails = {
    label: ["Home", "Work", "Other"].includes(shippingInfo.address?.label)
      ? shippingInfo.address.label
      : "Home",
    fullName: cleanShippingText(shippingInfo.address?.fullName || shippingInfo.fullName, 100),
    mobile: cleanShippingText(shippingInfo.address?.mobile || shippingInfo.phone, 20),
    pincode: cleanShippingText(shippingInfo.address?.pincode, 6),
    city: cleanShippingText(shippingInfo.address?.city, 100),
    state: cleanShippingText(shippingInfo.address?.state, 100),
    house: cleanShippingText(shippingInfo.address?.house, 240),
    area: cleanShippingText(shippingInfo.address?.area, 160),
    landmark: cleanShippingText(shippingInfo.address?.landmark, 160),
  };

  return {
    shippingAddress: [
      addressDetails.house,
      addressDetails.area,
      addressDetails.landmark,
      addressDetails.city,
      addressDetails.state,
      addressDetails.pincode,
    ]
      .filter(Boolean)
      .join(", "),
    shippingAddressDetails: addressDetails,
  };
};

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

  return safelyCompareSignatures(expectedSignature, signature);
};

const safelyCompareSignatures = (expectedSignature, receivedSignature) => {
  const expected = Buffer.from(String(expectedSignature || ""), "utf8");
  const received = Buffer.from(String(receivedSignature || ""), "utf8");

  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
};

const createCheckoutStateToken = (order) =>
  crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${order._id.toString()}|${order.checkoutSessionId}`)
    .digest("hex");

const assertCheckoutStateToken = (order, token) => {
  if (!safelyCompareSignatures(createCheckoutStateToken(order), token)) {
    throw new AppError("Checkout state is invalid or expired", 403);
  }
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

  const delivery = await sendEmail({
    to: order.customerEmail,
    subject,
    text: `${summaryLine}\nOrder #${order.orderNumber || order._id.toString()}\nTotal: Rs. ${order.totalAmount}`,
    html: buildOrderStatusEmail({
      order,
      summaryLine,
    }),
  });

  if (!delivery.delivered) {
    const error = new Error(delivery.reason || "Order email delivery failed");
    error.code = "ORDER_EMAIL_NOT_DELIVERED";
    throw error;
  }
};

const safelySendOrderEmail = async (order, subject, summaryLine) => {
  try {
    await sendOrderEmail(order, subject, summaryLine);
  } catch (error) {
    console.error("Order email failed", {
      orderId: order?._id?.toString?.(),
      orderNumber: order?.orderNumber,
      message: error?.message,
      code: error?.code,
      responseCode: error?.responseCode,
    });
  }
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

  return res.json(orders.map(buildPublicTrackingResponse));
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .select("-checkoutLogs")
    .populate("userId", "name email phone address");

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  const isOwner = order.userId?._id?.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (isAdmin && !hasAdminPermission(req.user, "orders.view")) {
    throw new AppError("You do not have permission to view this order", 403);
  }

  if (!isOwner && !isAdmin) {
    throw new AppError("Not authorized to view this order", 403);
  }

  return res.json(isAdmin ? order : buildPublicTrackingResponse(order));
});

const downloadInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    "userId",
    "name email phone address"
  );

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  const isOwner = order.userId?._id?.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (isAdmin && !hasAdminPermission(req.user, "orders.view")) {
    throw new AppError("You do not have permission to download this invoice", 403);
  }

  if (!isOwner && !isAdmin) {
    throw new AppError("Not authorized to download this invoice", 403);
  }

  const invoiceRef = order.orderNumber || order._id.toString();
  const pdfBuffer = buildInvoicePdf(order);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="hrushe-invoice-${invoiceRef}.pdf"`
  );

  return res.send(pdfBuffer);
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
    .select("-checkoutLogs -checkoutUrl")
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
    update.trackingId = String(trackingId || "").trim().slice(0, 120);
  }

  if (courierName !== undefined) {
    update.courierName = String(courierName || "").trim().slice(0, 100);
  }

  if (trackingUrl !== undefined) {
    const normalizedTrackingUrl = String(trackingUrl || "").trim();
    if (normalizedTrackingUrl) {
      let parsedTrackingUrl;
      try {
        parsedTrackingUrl = new URL(normalizedTrackingUrl);
      } catch {
        throw new AppError("Tracking URL must be a valid HTTPS URL", 400);
      }
      if (parsedTrackingUrl.protocol !== "https:") {
        throw new AppError("Tracking URL must use HTTPS", 400);
      }
    }
    update.trackingUrl = normalizedTrackingUrl.slice(0, 500);
  }

  const existingOrder = await Order.findById(req.params.id);
  if (!existingOrder) {
    throw new AppError("Order not found", 404);
  }

  const paidFulfillmentStatuses = ["Confirmed", "Packed", "Shipped", "Out for delivery", "Delivered"];
  if (
    orderStatus &&
    paidFulfillmentStatuses.includes(orderStatus) &&
    existingOrder.paymentStatus !== "paid"
  ) {
    throw new AppError("Unpaid orders cannot enter fulfillment", 409);
  }

  const order = await Order.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  await recordAuditLog(req, "order.status-change", { type: "order", id: order._id }, {
    orderStatus: order.orderStatus,
    trackingId: order.trackingId,
    courierName: order.courierName,
  });

  if (
    orderStatus !== undefined ||
    trackingId !== undefined ||
    courierName !== undefined ||
    trackingUrl !== undefined
  ) {
    await safelySendOrderEmail(
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

  const fullName = String(shippingInfo.fullName || "").trim();
  const email = String(shippingInfo.email || "").trim().toLowerCase();
  const phone = String(shippingInfo.phone || "").replace(/\D/g, "").slice(-10);
  const paymentMethod = "Razorpay";
  const { shippingAddress, shippingAddressDetails } = normalizeShippingAddress(shippingInfo);

  if (!fullName || !email || !phone || !shippingAddress) {
    throw new AppError("Full name, email, phone, and address are required", 400);
  }

  if (fullName.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError("Enter a valid name and email address", 400);
  }

  if (!/^[6-9]\d{9}$/.test(phone)) {
    throw new AppError("Enter a valid 10-digit Indian phone number", 400);
  }

  if (!/^\d{6}$/.test(shippingAddressDetails.pincode)) {
    throw new AppError("Enter a valid 6-digit Indian pincode", 400);
  }

  if (
    !shippingAddressDetails.house ||
    !shippingAddressDetails.area ||
    !shippingAddressDetails.city ||
    !shippingAddressDetails.state
  ) {
    throw new AppError("House, area, city, and state are required", 400);
  }

  shippingAddressDetails.fullName = fullName;
  shippingAddressDetails.mobile = phone;

  if (shippingAddress.length > 600) {
    throw new AppError("Shipping address is too long", 400);
  }

  const normalizedItems = await resolveCheckoutItems(items);

  const totalAmount = normalizedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const hasInventoryReservation = await reserveInventory(normalizedItems);

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
    if (hasInventoryReservation) {
      await releaseInventoryItems(normalizedItems);
    }
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

  let order;

  try {
    order = await Order.create({
      userId: req.user?._id || null,
      products: normalizedItems,
      totalAmount,
      shippingAddress,
      shippingAddressDetails,
      customerName: fullName,
      customerEmail: email,
      customerPhone: phone,
      paymentMethod,
      paymentStatus: "initiated",
      checkoutProvider: "razorpay",
      checkoutSessionId: razorpayOrder.id,
      checkoutUrl: "",
      inventoryReservationStatus: hasInventoryReservation ? "reserved" : "none",
      inventoryReservationExpiresAt: hasInventoryReservation
        ? new Date(Date.now() + RESERVATION_WINDOW_MS)
        : null,
      checkoutLogs: [
        {
          event: "checkout_created",
          source: "backend",
          payload: {
            shippingInfo: { ...shippingInfo, shippingAddress, shippingAddressDetails },
            items: normalizedItems,
            razorpayOrderId: razorpayOrder.id,
          },
        },
      ],
    });
  } catch (error) {
    if (hasInventoryReservation) {
      await releaseInventoryItems(normalizedItems);
    }
    throw error;
  }

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
    checkoutState: createCheckoutStateToken(order),
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

  if (order.paymentStatus === "paid") {
    return res.json({
      success: true,
      redirectUrl: buildRedirectUrl(
        "/checkout/success",
        String(order.orderNumber || order._id.toString())
      ),
    });
  }

  const isValidSignature = verifyRazorpaySignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });

  if (!isValidSignature) {
    throw new AppError("Invalid Razorpay payment signature", 400);
  }

  await commitOrderInventory(order);
  order.paymentStatus = "paid";
  order.orderStatus = "Confirmed";
  order.checkoutUrl = "";
  recordCheckoutLog(order, "razorpay_payment_verified", "backend", {
    razorpayOrderId,
    razorpayPaymentId,
  });
  await order.save();
  if (order.userId) {
    await Cart.findOneAndUpdate({ userId: order.userId }, { items: [] });
  }
  await safelySendOrderEmail(
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
  const orderId = req.body?.appOrderId || req.query.orderId;
  const checkoutState = req.body?.checkoutState || req.query.checkoutState;

  if (!orderId) {
    throw new AppError("Order id is required", 400);
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  assertCheckoutStateToken(order, checkoutState);

  if (order.paymentStatus !== "paid") {
    await releaseOrderInventory(order);
    order.paymentStatus = req.method === "POST" ? "cancelled" : "failed";
  }
  recordCheckoutLog(order, "checkout_failure_return", "redirect", req.query);
  await order.save();

  if (req.method === "POST") {
    return res.json({ success: true });
  }

  return res.redirect(
    buildRedirectUrl("/checkout/failure", String(order.orderNumber || order._id.toString()))
  );
});

const cancelCheckout = asyncHandler(async (req, res) => {
  const { orderId, checkoutState } = req.query;

  if (!orderId) {
    throw new AppError("Order id is required", 400);
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  assertCheckoutStateToken(order, checkoutState);

  if (order.paymentStatus !== "paid") {
    await releaseOrderInventory(order);
    order.paymentStatus = "cancelled";
    order.orderStatus = "Cancelled";
  }
  recordCheckoutLog(order, "checkout_cancel_return", "redirect", req.query);
  await order.save();

  return res.redirect(
    buildRedirectUrl("/checkout/failure", String(order.orderNumber || order._id.toString()))
  );
});

const razorpayWebhook = asyncHandler(async (req, res) => {
  const signature = String(req.headers["x-razorpay-signature"] || "").trim();

  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    throw new AppError("Razorpay webhook is not configured", 503);
  }

  if (!signature) {
    throw new AppError("Missing webhook signature", 401);
  }

  if (!req.rawBody) {
    throw new AppError("Webhook payload unavailable for signature verification", 400);
  }

  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.rawBody)
    .digest("hex");

  if (!safelyCompareSignatures(expectedSignature, signature)) {
    throw new AppError("Invalid webhook signature", 401);
  }

  const event = String(req.body.event || "");
  const paymentEntity = req.body.payload?.payment?.entity;
  const razorpayOrderId = paymentEntity?.order_id;
  const providerEventId = String(
    req.headers["x-razorpay-event-id"] ||
      `${event}:${paymentEntity?.id || razorpayOrderId || "unknown"}:${paymentEntity?.status || ""}`
  );

  let webhookEvent;
  try {
    webhookEvent = await WebhookEvent.create({
      provider: "razorpay",
      eventId: providerEventId,
      eventType: event,
      status: "processing",
    });
  } catch (error) {
    if (error?.code === 11000) {
      const existingEvent = await WebhookEvent.findOne({
        provider: "razorpay",
        eventId: providerEventId,
      });
      if (existingEvent?.status === "completed") {
        return res.json({ received: true, duplicate: true });
      }
      const isRecentlyProcessing =
        existingEvent?.status === "processing" &&
        Date.now() - new Date(existingEvent.updatedAt).getTime() < 5 * 60 * 1000;
      if (isRecentlyProcessing) {
        return res.status(409).json({ received: false, retry: true });
      }
      existingEvent.status = "processing";
      existingEvent.error = "";
      await existingEvent.save();
      webhookEvent = existingEvent;
    } else {
      throw error;
    }
  }

  if (!razorpayOrderId) {
    webhookEvent.status = "completed";
    webhookEvent.processedAt = new Date();
    await webhookEvent.save();
    return res.json({ received: true });
  }

  const order = await Order.findOne({ checkoutSessionId: razorpayOrderId });

  if (!order) {
    webhookEvent.status = "completed";
    webhookEvent.processedAt = new Date();
    await webhookEvent.save();
    return res.json({ received: true });
  }

  try {
    if (event === "payment.captured") {
      const expectedAmount = Math.round(Number(order.totalAmount) * 100);
      if (
        Number(paymentEntity?.amount) !== expectedAmount ||
        String(paymentEntity?.currency || "").toUpperCase() !== env.RAZORPAY_CURRENCY
      ) {
        throw new AppError("Webhook payment amount or currency does not match the order", 409);
      }
      await commitOrderInventory(order);
      order.paymentStatus = "paid";
      order.orderStatus = "Confirmed";
      if (order.userId) {
        await Cart.findOneAndUpdate({ userId: order.userId }, { items: [] });
      }
    } else if (event === "payment.failed" && order.paymentStatus !== "paid") {
      await releaseOrderInventory(order);
      order.paymentStatus = "failed";
    }

    recordCheckoutLog(order, "razorpay_webhook_received", "webhook", {
      event,
      providerEventId,
      paymentId: paymentEntity?.id || "",
      paymentStatus: paymentEntity?.status || "",
    });
    await order.save();
    webhookEvent.status = "completed";
    webhookEvent.processedAt = new Date();
    await webhookEvent.save();
  } catch (error) {
    webhookEvent.status = "failed";
    webhookEvent.error = String(error?.message || "Webhook processing failed").slice(0, 500);
    await webhookEvent.save().catch(() => undefined);
    throw error;
  }

  return res.json({ received: true });
});

const reorderOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.userId.toString() !== req.user._id.toString()) {
    throw new AppError("Not authorized to reorder this order", 403);
  }

  let cart = await Cart.findOne({ userId: req.user._id }).populate("items.productId");

  if (!cart) {
    cart = await Cart.create({ userId: req.user._id, items: [] });
  }

  for (const product of order.products) {
    const existingItem = cart.items.find(
      (item) =>
        getCartItemProductId(item) === product.productId.toString() &&
        item.size === (product.size || "") &&
        item.color === (product.color || "") &&
        item.fit === (product.fit || "")
    );

    if (existingItem) {
      existingItem.quantity += product.quantity;
    } else {
      cart.items.push({
        productId: product.productId,
        quantity: product.quantity,
        size: product.size || "",
        color: product.color || "",
        fit: product.fit || "",
      });
    }
  }

  await cart.save();
  await cart.populate("items.productId");

  return res.json({
    message: "Items added to cart",
    cart: cart.items.map((item) => ({
      productId: item.productId._id.toString(),
      name: item.productId.name,
      price: item.productId.price,
      size: item.size || "",
      color: item.color || "",
      fit: item.fit || "",
      quantity: item.quantity,
      image: item.productId.images?.[0] || "",
      accent: "#111111",
    })),
  });
});

module.exports = {
  placeOrder,
  getMyOrders,
  getOrderById,
  downloadInvoice,
  trackOrder,
  getAllOrders,
  updateOrderStatus,
  createCheckout,
  verifyCheckout,
  failCheckout,
  cancelCheckout,
  razorpayWebhook,
  reorderOrder,
};
