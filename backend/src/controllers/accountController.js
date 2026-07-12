const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const SupportRequest = require("../models/SupportRequest");
const env = require("../config/env");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { sendEmail } = require("../utils/mailer");
const { buildOtpEmail, buildSupportRequestAdminEmail } = require("../utils/emailTemplates");
const { serializeUser, serializeAddress } = require("../utils/serializeUser");
const { clearCsrfCookie } = require("../middleware/csrfMiddleware");
const { recordAuditLog } = require("../utils/auditLog");
const { logEvent } = require("../utils/logger");
const {
  createOtpVerification,
  deleteOtpVerifications,
  normalizeEmail,
  verifyOtpCode,
} = require("../utils/otpVerification");
const { isValidIndianPhone, normalizeIndianPhone } = require("../utils/phone");

const FAVORITE_COLOR_LIMIT = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validateEmail = (email) => {
  if (!EMAIL_PATTERN.test(email)) {
    throw new AppError("Enter a valid email address", 400);
  }
};

const validateIndianPhone = (phone) => {
  if (!isValidIndianPhone(phone)) {
    throw new AppError("Enter a valid 10-digit Indian phone number", 400);
  }
};

const authCookieOptions = {
  sameSite: env.COOKIE_SAME_SITE,
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  path: "/",
};

const formatAddressText = (address) =>
  [
    address.house,
    address.area,
    address.landmark,
    address.city,
    address.state,
    address.pincode,
  ]
    .filter(Boolean)
    .join(", ");

const normalizeAddressPayload = (payload = {}) => ({
  label: ["Home", "Work", "Other"].includes(payload.label) ? payload.label : "Home",
  fullName: String(payload.fullName || "").trim(),
  mobile: String(payload.mobile || "").trim(),
  pincode: String(payload.pincode || "").trim(),
  city: String(payload.city || "").trim(),
  state: String(payload.state || "").trim(),
  house: String(payload.house || "").trim(),
  area: String(payload.area || "").trim(),
  landmark: String(payload.landmark || "").trim(),
});

const validateAddressPayload = (address) => {
  if (
    !address.fullName ||
    !address.mobile ||
    !address.pincode ||
    !address.city ||
    !address.state ||
    !address.house ||
    !address.area
  ) {
    throw new AppError(
      "Full name, mobile, pincode, city, state, house/building, and area are required",
      400
    );
  }

  validateIndianPhone(address.mobile);

  if (!/^\d{6}$/.test(address.pincode)) {
    throw new AppError("Enter a valid 6-digit pincode", 400);
  }
};

const syncLegacyAddressField = (user) => {
  const defaultAddress =
    user.addresses.find((address) => address.isDefault) || user.addresses[0] || null;
  user.address = defaultAddress ? formatAddressText(defaultAddress) : "";
};

const getFreshUser = (userId) => User.findById(userId).populate("wishlist");

const mapWishlistProducts = (products) =>
  products.map((product) => ({
    id: product._id.toString(),
    name: product.name,
    slug: product.slug,
    price: product.price,
    compareAtPrice: product.compareAtPrice || null,
    category: product.category,
    categories: product.categories || [],
    sizes: product.sizes || [],
    colors: product.colors || [],
    images: product.images || [],
    featured: Boolean(product.featured),
    bestSeller: Boolean(product.bestSeller),
    newIn: Boolean(product.newIn),
    newArrival: Boolean(product.newArrival),
  }));

const getCartItemProductId = (item) =>
  item?.productId?._id?.toString?.() || item?.productId?.toString?.() || "";

const buildCartSummaryItem = (item) => ({
  productId: item.productId._id.toString(),
  name: item.productId.name,
  price: item.productId.price,
  size: item.size || "",
  color: item.color || "",
  fit: item.fit || "",
  quantity: item.quantity,
  image: item.productId.images?.[0] || "",
  accent: "#111111",
});

const getAccountSummary = asyncHandler(async (req, res) => {
  const [user, recentOrders, orderCount] = await Promise.all([
    getFreshUser(req.user._id),
    Order.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(3),
    Order.countDocuments({ userId: req.user._id }),
  ]);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return res.json({
    user: serializeUser(user),
    counts: {
      orders: orderCount,
      addresses: user.addresses.length,
      wishlist: user.wishlist.length,
    },
    recentOrders,
  });
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await getFreshUser(req.user._id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return res.json({ user: serializeUser(user) });
});

const updateProfile = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    gender = "",
    dateOfBirth = null,
    profilePictureUrl = "",
  } = req.body;

  if (!name || !email || !phone) {
    throw new AppError("Name, email, and phone are required", 400);
  }

  const normalizedName = String(name).trim();
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizeIndianPhone(phone);

  if (normalizedName.length < 2) {
    throw new AppError("Full name must be at least 2 characters long", 400);
  }

  validateEmail(normalizedEmail);
  validateIndianPhone(normalizedPhone);

  if (normalizedEmail !== normalizeEmail(req.user.email)) {
    throw new AppError("Email changes require OTP verification.", 400);
  }

  const [existingPhoneUser, user] = await Promise.all([
    User.findOne({ phone: normalizedPhone, _id: { $ne: req.user._id } }),
    User.findById(req.user._id),
  ]);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (existingPhoneUser) {
    throw new AppError("Phone number is already in use", 409);
  }

  user.name = normalizedName;
  user.phone = normalizedPhone;
  user.gender = String(gender || "").trim();
  user.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
  user.profilePictureUrl = String(profilePictureUrl || "").trim();
  await user.save();

  return res.json({
    message: "Profile updated successfully",
    user: serializeUser(user),
  });
});

const requestEmailChangeOtp = asyncHandler(async (req, res) => {
  const newEmail = normalizeEmail(req.body.newEmail);

  if (!newEmail) {
    throw new AppError("New email is required", 400);
  }

  validateEmail(newEmail);

  if (newEmail === normalizeEmail(req.user.email)) {
    throw new AppError("This email is already linked to your account", 400);
  }

  const existingUser = await User.findOne({
    email: newEmail,
    _id: { $ne: req.user._id },
  });

  if (existingUser) {
    throw new AppError("Choose a different email address.", 409);
  }

  const { otp, expiresInMinutes } = await createOtpVerification({
    email: newEmail,
    purpose: "email-change",
    userId: req.user._id,
  });

  let delivery;
  try {
    delivery = await sendEmail({
      to: newEmail,
      subject: "Confirm your new HRUSHE email",
      html: buildOtpEmail({
        purpose: "email-change",
        otp,
        expiryMinutes: expiresInMinutes,
        email: newEmail,
      }),
      mergeInfo: {
        otp,
        email: newEmail,
        expiry_minutes: expiresInMinutes,
        expiryMinutes: expiresInMinutes,
      },
    });
  } catch (error) {
    await deleteOtpVerifications({ email: newEmail, purpose: "email-change", userId: req.user._id });
    logEvent("email.change_otp.delivery_failed", {
      message: error?.message,
      code: error?.code,
      responseCode: error?.responseCode,
    }, "error");
    throw new AppError("OTP email could not be sent. Please try again later.", 502);
  }

  if (!delivery.delivered) {
    await deleteOtpVerifications({ email: newEmail, purpose: "email-change", userId: req.user._id });
    throw new AppError("OTP email could not be sent. Please try again later.", 502);
  }

  const response = {
    message: "If this email can be used, an OTP has been sent.",
    expiresInMinutes,
  };

  if (env.OTP_DEV_MODE) {
    response.devOtp = otp;
  }

  return res.json(response);
});

const verifyEmailChangeOtp = asyncHandler(async (req, res) => {
  const newEmail = normalizeEmail(req.body.newEmail);
  const otp = String(req.body.otp || "").trim();

  if (!newEmail || !otp) {
    throw new AppError("New email and OTP are required", 400);
  }

  validateEmail(newEmail);

  await verifyOtpCode({
    email: newEmail,
    purpose: "email-change",
    userId: req.user._id,
    otp,
  });

  const existingUser = await User.findOne({
    email: newEmail,
    _id: { $ne: req.user._id },
  });

  if (existingUser) {
    throw new AppError("Choose a different email address.", 409);
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const previousEmail = user.email;
  user.email = newEmail;
  user.emailVerifiedAt = new Date();
  user.isVerified = true;
  user.tokenVersion = Number(user.tokenVersion || 0) + 1;
  await user.save();

  await deleteOtpVerifications({ email: newEmail, purpose: "email-change", userId: req.user._id });
  await recordAuditLog(req, "account.email-change", { type: "user", id: user._id }, {
    before: previousEmail,
    after: newEmail,
  });

  res.clearCookie("token", authCookieOptions);
  clearCsrfCookie(res);

  return res.json({
    message: "Email changed successfully. Please sign in again with your new email.",
  });
});

const getAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return res.json({
    addresses: user.addresses.map(serializeAddress),
  });
});

const createAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const normalizedAddress = normalizeAddressPayload(req.body);
  validateAddressPayload(normalizedAddress);

  const shouldBeDefault =
    Boolean(req.body.isDefault) || user.addresses.length === 0;

  if (shouldBeDefault) {
    user.addresses.forEach((address) => {
      address.isDefault = false;
    });
  }

  user.addresses.push({
    ...normalizedAddress,
    isDefault: shouldBeDefault,
  });
  syncLegacyAddressField(user);
  await user.save();

  return res.status(201).json({
    message: "Address added successfully",
    addresses: user.addresses.map(serializeAddress),
  });
});

const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const address = user.addresses.id(req.params.addressId);

  if (!address) {
    throw new AppError("Address not found", 404);
  }

  const normalizedAddress = normalizeAddressPayload(req.body);
  validateAddressPayload(normalizedAddress);

  Object.assign(address, normalizedAddress);

  if (req.body.isDefault) {
    user.addresses.forEach((entry) => {
      entry.isDefault = entry._id.toString() === req.params.addressId;
    });
  }

  syncLegacyAddressField(user);
  await user.save();

  return res.json({
    message: "Address updated successfully",
    addresses: user.addresses.map(serializeAddress),
  });
});

const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const address = user.addresses.id(req.params.addressId);

  if (!address) {
    throw new AppError("Address not found", 404);
  }

  const removedWasDefault = address.isDefault;
  address.deleteOne();

  if (removedWasDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  syncLegacyAddressField(user);
  await user.save();

  return res.json({
    message: "Address deleted successfully",
    addresses: user.addresses.map(serializeAddress),
  });
});

const setDefaultAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const address = user.addresses.id(req.params.addressId);

  if (!address) {
    throw new AppError("Address not found", 404);
  }

  user.addresses.forEach((entry) => {
    entry.isDefault = entry._id.toString() === req.params.addressId;
  });
  syncLegacyAddressField(user);
  await user.save();

  return res.json({
    message: "Default address updated successfully",
    addresses: user.addresses.map(serializeAddress),
  });
});

const getPreferences = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return res.json({
    preferences: serializeUser(user).preferences,
  });
});

const updatePreferences = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const favoriteColors = Array.isArray(req.body.favoriteColors)
    ? req.body.favoriteColors
        .map((value) => String(value || "").trim())
        .filter(Boolean)
        .slice(0, FAVORITE_COLOR_LIMIT)
    : [];

  user.preferences = {
    preferredSize: String(req.body.preferredSize || "").trim(),
    preferredFit: ["Oversize", "Regular"].includes(req.body.preferredFit)
      ? req.body.preferredFit
      : "",
    favoriteColors,
  };
  await user.save();

  return res.json({
    message: "Preferences saved successfully",
    preferences: serializeUser(user).preferences,
  });
});

const getCommunicationPreferences = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return res.json({
    communicationPreferences: serializeUser(user).communicationPreferences,
  });
});

const updateCommunicationPreferences = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.communicationPreferences = {
    emailNotifications: req.body.emailNotifications !== false,
    whatsappOrderUpdates: req.body.whatsappOrderUpdates !== false,
    marketingMessages: Boolean(req.body.marketingMessages),
  };
  await user.save();

  return res.json({
    message: "Notification preferences saved successfully",
    communicationPreferences: serializeUser(user).communicationPreferences,
  });
});

const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("wishlist");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return res.json({
    products: mapWishlistProducts(user.wishlist),
  });
});

const addWishlistItem = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const exists = user.wishlist.some(
    (wishlistId) => wishlistId.toString() === req.params.productId
  );

  if (!exists) {
    user.wishlist.unshift(product._id);
    await user.save();
  }

  const refreshedUser = await User.findById(req.user._id).populate("wishlist");

  return res.status(201).json({
    message: "Added to wishlist",
    products: mapWishlistProducts(refreshedUser.wishlist),
  });
});

const removeWishlistItem = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.wishlist = user.wishlist.filter(
    (wishlistId) => wishlistId.toString() !== req.params.productId
  );
  await user.save();

  const refreshedUser = await User.findById(req.user._id).populate("wishlist");

  return res.json({
    message: "Removed from wishlist",
    products: mapWishlistProducts(refreshedUser.wishlist),
  });
});

const moveWishlistItemToCart = asyncHandler(async (req, res) => {
  const { size = "", color = "", fit = "", quantity = 1 } = req.body;
  const normalizedVariant = {
    size: String(size || "").trim(),
    color: String(color || "").trim(),
    fit: ["Oversize", "Regular"].includes(fit) ? fit : "",
    quantity: Number(quantity) || 1,
  };
  const product = await Product.findById(req.params.productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  let cart = await Cart.findOne({ userId: req.user._id }).populate("items.productId");

  if (!cart) {
    cart = await Cart.create({ userId: req.user._id, items: [] });
  }

  const existingItem = cart.items.find(
    (item) =>
      getCartItemProductId(item) === req.params.productId &&
      item.size === normalizedVariant.size &&
      item.color === normalizedVariant.color &&
      item.fit === normalizedVariant.fit
  );

  if (existingItem) {
    existingItem.quantity += normalizedVariant.quantity;
  } else {
    cart.items.push({
      productId: product._id,
      quantity: normalizedVariant.quantity,
      size: normalizedVariant.size,
      color: normalizedVariant.color,
      fit: normalizedVariant.fit,
    });
  }

  user.wishlist = user.wishlist.filter(
    (wishlistId) => wishlistId.toString() !== req.params.productId
  );

  await Promise.all([cart.save(), user.save()]);
  await cart.populate("items.productId");

  return res.json({
    message: "Moved to cart",
    cart: {
      items: cart.items.map(buildCartSummaryItem),
    },
    wishlistCount: user.wishlist.length,
  });
});

const createSupportRequest = asyncHandler(async (req, res) => {
  const { category, subject, message, orderId = null } = req.body;

  if (!subject || !message) {
    throw new AppError("Subject and message are required", 400);
  }

  const supportRequest = await SupportRequest.create({
    userId: req.user._id,
    category:
      ["track-order", "return-request", "exchange-request", "contact-support"].includes(
        category
      )
        ? category
        : "contact-support",
    source: "account",
    customerName: req.user.name,
    customerEmail: req.user.email,
    customerPhone: req.user.phone || "",
    orderId: orderId || "",
    subject: String(subject).trim(),
    message: String(message).trim(),
    priority:
      ["return-request", "exchange-request"].includes(category)
        ? "high"
        : "normal",
    assignedRole: "operations-manager",
  });

  try {
    const delivery = await sendEmail({
      to: "team@hrushe.in",
      subject: `HRUSHE support: ${supportRequest.subject}`,
      html: buildSupportRequestAdminEmail({
        customerName: req.user.name,
        customerEmail: req.user.email,
        customerPhone: req.user.phone || "",
        category: supportRequest.category,
        priority: supportRequest.priority,
        source: supportRequest.source,
        assignedRole: supportRequest.assignedRole,
        orderId,
        message: supportRequest.message,
        subject: supportRequest.subject,
        ticketCode: supportRequest.ticketNumber
          ? `HRSH-${String(supportRequest.ticketNumber).padStart(4, "0")}`
          : "",
      }),
    });
    if (!delivery.delivered) {
      throw new Error(delivery.reason || "Support request email delivery failed");
    }
  } catch (error) {
    logEvent("support.request.email_failed", {
      message: error?.message,
      code: error?.code,
      responseCode: error?.responseCode,
    }, "error");
  }

  return res.status(201).json({
    message: "Support request received",
    request: supportRequest,
  });
});

module.exports = {
  getAccountSummary,
  getProfile,
  updateProfile,
  requestEmailChangeOtp,
  verifyEmailChangeOtp,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getPreferences,
  updatePreferences,
  getCommunicationPreferences,
  updateCommunicationPreferences,
  getWishlist,
  addWishlistItem,
  removeWishlistItem,
  moveWishlistItemToCart,
  createSupportRequest,
};
