const User = require("../models/User");
const Order = require("../models/Order");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

function buildCustomerStatus({ createdAt, orderCount, totalSpend, lastOrderDate }) {
  const daysSinceSignup = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
  const daysSinceLastOrder = lastOrderDate
    ? Math.floor((Date.now() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  if (totalSpend >= 10000 || orderCount >= 4) {
    return "VIP";
  }

  if (orderCount === 0 && daysSinceSignup > 14) {
    return "At Risk";
  }

  if (daysSinceLastOrder !== null && daysSinceLastOrder > 120) {
    return "At Risk";
  }

  if (daysSinceSignup <= 14) {
    return "New";
  }

  return "Active";
}

function serializeWishlistItem(item) {
  if (!item) {
    return null;
  }

  const object = typeof item.toObject === "function" ? item.toObject() : item;

  return {
    id: object._id?.toString?.() || object.id,
    name: object.name || "",
    slug: object.slug || "",
    category: object.category || "",
    price: object.price || 0,
    compareAtPrice: object.compareAtPrice || 0,
    accent: object.accent || "#111111",
    images: object.images || [],
  };
}

function serializeCustomer(user, orders = []) {
  const totalSpend = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const averageOrderValue = orders.length > 0 ? totalSpend / orders.length : 0;
  const lastOrderDate = orders[0]?.createdAt || null;
  const status = buildCustomerStatus({
    createdAt: user.createdAt,
    orderCount: orders.length,
    totalSpend,
    lastOrderDate,
  });

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    gender: user.gender || "",
    dateOfBirth: user.dateOfBirth || null,
    role: user.role,
    profilePictureUrl: user.profilePictureUrl || "",
    address: user.address || "",
    addresses: user.addresses || [],
    preferences: user.preferences || {},
    communicationPreferences: user.communicationPreferences || {},
    wishlist: (user.wishlist || []).map(serializeWishlistItem).filter(Boolean),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    orderCount: orders.length,
    totalSpend,
    averageOrderValue,
    lastOrderDate,
    status,
    notes: [],
  };
}

const listCustomers = asyncHandler(async (req, res) => {
  const [users, orders] = await Promise.all([
    User.find({ role: { $ne: "admin" } })
      .select("-password -passwordResetOtp -passwordResetOtpExpiresAt")
      .populate("wishlist"),
    Order.find({})
      .sort({ createdAt: -1 })
      .select("userId totalAmount createdAt orderStatus paymentStatus customerEmail"),
  ]);

  const ordersByUser = new Map();

  orders.forEach((order) => {
    const key = order.userId?.toString?.();
    if (!key) {
      return;
    }

    const current = ordersByUser.get(key) || [];
    current.push(order);
    ordersByUser.set(key, current);
  });

  const serialized = users
    .map((user) => serializeCustomer(user, ordersByUser.get(user._id.toString()) || []))
    .sort((a, b) => {
      if (b.totalSpend !== a.totalSpend) {
        return b.totalSpend - a.totalSpend;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  res.json(serialized);
});

const getCustomerById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("-password -passwordResetOtp -passwordResetOtpExpiresAt")
    .populate("wishlist");

  if (!user || user.role === "admin") {
    throw new AppError("Customer not found", 404);
  }

  const orders = await Order.find({ userId: user._id }).sort({ createdAt: -1 });

  res.json({
    ...serializeCustomer(user, orders),
    orders,
  });
});

module.exports = {
  listCustomers,
  getCustomerById,
};
