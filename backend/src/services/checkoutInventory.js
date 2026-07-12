const mongoose = require("mongoose");
const Product = require("../models/Product");
const Order = require("../models/Order");
const AppError = require("../utils/AppError");
const { getPaiseValue, paiseToRupees } = require("../utils/money");

const MAX_CART_LINES = 25;
const MAX_ITEM_QUANTITY = 10;
const RESERVATION_WINDOW_MS = 15 * 60 * 1000;

const cleanText = (value) => String(value || "").trim();
const compareText = (left, right) =>
  cleanText(left).toLowerCase() === cleanText(right).toLowerCase();
const normalizeFit = (value) => {
  const normalized = cleanText(value).toLowerCase();
  if (normalized === "oversized" || normalized === "oversize") {
    return "Oversize";
  }
  if (normalized === "regular") {
    return "Regular";
  }
  return "";
};

const normalizeCheckoutSelections = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  if (items.length > MAX_CART_LINES) {
    throw new AppError("Your cart has too many separate items", 400);
  }

  const selections = new Map();

  for (const item of items) {
    const productId = cleanText(item?.productId);
    const quantity = Number(item?.quantity);

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new AppError("Your cart contains an invalid product", 400);
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new AppError("Product quantities must be whole numbers", 400);
    }

    const size = cleanText(item?.size);
    const color = cleanText(item?.color);
    const fit = cleanText(item?.fit);
    const key = [productId, size.toLowerCase(), color.toLowerCase(), fit.toLowerCase()].join(":");
    const existing = selections.get(key);
    const combinedQuantity = (existing?.quantity || 0) + quantity;

    if (combinedQuantity > MAX_ITEM_QUANTITY) {
      throw new AppError(`A maximum of ${MAX_ITEM_QUANTITY} units is allowed per item`, 400);
    }

    selections.set(key, {
      productId,
      quantity: combinedQuantity,
      size,
      color,
      fit,
    });
  }

  return Array.from(selections.values());
};

const findCanonicalOption = (options, selected, label, productName) => {
  const available = Array.isArray(options) ? options.filter(Boolean) : [];

  if (available.length === 0) {
    return cleanText(selected);
  }

  const matched = available.find((option) => compareText(option, selected));
  if (!matched) {
    throw new AppError(`Choose an available ${label} for ${productName}`, 400);
  }

  return matched;
};

const isPubliclyPurchasable = (product) =>
  !["Draft", "Hidden", "Sold Out"].includes(product.status) &&
  !/^test(?:\s|$)/i.test(product.name || "");

const findMatchingVariant = (product, selection) =>
  (product.variants || []).find(
    (variant) =>
      variant.active !== false &&
      compareText(variant.size, selection.size) &&
      compareText(variant.color, selection.color) &&
      (!cleanText(variant.fit) ||
        !cleanText(selection.fit) ||
        normalizeFit(variant.fit) === normalizeFit(selection.fit))
  );

const resolveCheckoutItems = async (rawItems = []) => {
  const selections = normalizeCheckoutSelections(rawItems);
  if (selections.length === 0) {
    throw new AppError("Cart is empty", 400);
  }

  const productIds = [...new Set(selections.map((item) => item.productId))];
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((product) => [product._id.toString(), product]));

  return selections.map((selection) => {
    const product = productMap.get(selection.productId);

    if (!product || !isPubliclyPurchasable(product)) {
      throw new AppError("A product in your cart is no longer available", 409);
    }

    const size = findCanonicalOption(product.sizes, selection.size, "size", product.name);
    const color = findCanonicalOption(product.colors, selection.color, "color", product.name);
    const normalizedSelection = { ...selection, size, color };
    const variant = product.trackInventory
      ? findMatchingVariant(product, normalizedSelection)
      : null;

    if (product.trackInventory && !variant) {
      throw new AppError(`${product.name} is unavailable in that option`, 409);
    }

    if (variant && variant.stock < selection.quantity) {
      throw new AppError(`Only ${variant.stock} unit(s) of ${product.name} are available`, 409);
    }

    return {
      productId: product._id,
      quantity: selection.quantity,
      size,
      color,
      fit: normalizeFit(selection.fit),
      price: paiseToRupees(getPaiseValue(product, "pricePaise", "price")),
      pricePaise: getPaiseValue(product, "pricePaise", "price"),
      name: product.name,
      image: product.images?.[0] || product.galleryImages?.[0] || "",
      sku: variant?.sku || "",
      inventoryTracked: Boolean(product.trackInventory && variant),
    };
  });
};

const updateReservedVariant = async (item, operation, { session } = {}) => {
  if (!item.inventoryTracked || !item.sku) {
    return true;
  }

  const quantity = Number(item.quantity);
  const isReserve = operation === "reserve";
  const isRelease = operation === "release";
  const query = {
    _id: item.productId,
    variants: {
      $elemMatch: {
        sku: item.sku,
        ...(isReserve ? { active: true } : {}),
        ...(isReserve ? { stock: { $gte: quantity } } : { reserved: { $gte: quantity } }),
      },
    },
  };
  const increment = isReserve
    ? { "variants.$[variant].stock": -quantity, "variants.$[variant].reserved": quantity }
    : isRelease
      ? { "variants.$[variant].stock": quantity, "variants.$[variant].reserved": -quantity }
      : { "variants.$[variant].reserved": -quantity };
  const result = await Product.updateOne(
    query,
    { $inc: increment },
    {
      arrayFilters: [
        {
          "variant.sku": item.sku,
          ...(isReserve ? { "variant.active": true } : {}),
          ...(isReserve ? { "variant.stock": { $gte: quantity } } : { "variant.reserved": { $gte: quantity } }),
        },
      ],
      ...(session ? { session } : {}),
    }
  );

  return result.modifiedCount === 1;
};

const reserveInventory = async (items) => {
  const reserved = [];

  try {
    for (const item of items) {
      if (!item.inventoryTracked) {
        continue;
      }

      if (!(await updateReservedVariant(item, "reserve"))) {
        throw new AppError(`${item.name} just sold out in that option`, 409);
      }
      reserved.push(item);
    }
  } catch (error) {
    await Promise.all(reserved.map((item) => updateReservedVariant(item, "release")));
    throw error;
  }

  return reserved.length > 0;
};

const transitionOrderInventory = async (order, operation, options = {}) => {
  if (!order || order.inventoryReservationStatus !== "reserved") {
    return;
  }

  const trackedItems = order.products.filter((item) => item.inventoryTracked);
  const results = await Promise.all(
    trackedItems.map((item) => updateReservedVariant(item, operation, options))
  );

  if (results.some((updated) => !updated)) {
    const action = operation === "commit" ? "committed" : "released";
    throw new AppError(
      `Inventory reservation could not be ${action}. Please retry or reconcile the order.`,
      409
    );
  }

  order.inventoryReservationStatus = operation === "commit" ? "committed" : "released";
  order.inventoryReservationExpiresAt = null;
};

const commitOrderInventory = (order, options = {}) =>
  transitionOrderInventory(order, "commit", options);
const releaseOrderInventory = (order, options = {}) =>
  transitionOrderInventory(order, "release", options);

const releaseInventoryItems = async (items) => {
  await Promise.all(
    items.filter((item) => item.inventoryTracked).map((item) => updateReservedVariant(item, "release"))
  );
};

const cleanupExpiredInventoryReservations = async () => {
  const expiredOrders = await Order.find({
    inventoryReservationStatus: "reserved",
    inventoryReservationExpiresAt: { $lte: new Date() },
    paymentStatus: { $in: ["pending", "initiated", "failed", "cancelled"] },
  }).limit(50);

  for (const order of expiredOrders) {
    await releaseOrderInventory(order);
    if (order.paymentStatus === "initiated") {
      order.paymentStatus = "cancelled";
    }
    await order.save();
  }

  return expiredOrders.length;
};

module.exports = {
  RESERVATION_WINDOW_MS,
  normalizeCheckoutSelections,
  resolveCheckoutItems,
  reserveInventory,
  releaseInventoryItems,
  commitOrderInventory,
  releaseOrderInventory,
  cleanupExpiredInventoryReservations,
};
