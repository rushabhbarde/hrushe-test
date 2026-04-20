const Cart = require("../models/Cart");
const Product = require("../models/Product");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ userId }).populate("items.productId");

  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
    cart = await cart.populate("items.productId");
  }

  return cart;
};

const mapCart = (cart) => ({
  id: cart._id.toString(),
  items: cart.items.map((item) => ({
    productId: item.productId._id.toString(),
    quantity: item.quantity,
    size: item.size || "",
    color: item.color || "",
    fit: item.fit || "",
    name: item.productId.name,
    price: item.productId.price,
    image: item.productId.images?.[0] || "",
    accent: "#111111",
  })),
  updatedAt: cart.updatedAt,
});

const getCartItemProductId = (item) =>
  item?.productId?._id?.toString?.() || item?.productId?.toString?.() || "";

const findExistingCartItem = (cart, { productId, size = "", color = "", fit = "" }) =>
  cart.items.find(
    (item) =>
      getCartItemProductId(item) === productId &&
      item.size === size &&
      item.color === color &&
      item.fit === fit
  );

const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, size = "", color = "", fit = "" } = req.body;

  if (!productId) {
    throw new AppError("Product is required", 400);
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const cart = await getOrCreateCart(req.user._id);
  const normalizedVariant = {
    productId,
    size: String(size || "").trim(),
    color: String(color || "").trim(),
    fit: ["Oversize", "Regular"].includes(fit) ? fit : "",
  };
  const existingItem = findExistingCartItem(cart, normalizedVariant);

  if (existingItem) {
    existingItem.quantity += Number(quantity);
  } else {
    cart.items.push({
      productId,
      quantity: Number(quantity),
      size: normalizedVariant.size,
      color: normalizedVariant.color,
      fit: normalizedVariant.fit,
    });
  }

  await cart.save();
  await cart.populate("items.productId");

  return res.status(201).json(mapCart(cart));
});

const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  return res.json(mapCart(cart));
});

const removeFromCart = asyncHandler(async (req, res) => {
  const { productId, size = "", color = "", fit = "" } = req.body;

  const cart = await getOrCreateCart(req.user._id);
  cart.items = cart.items.filter(
    (item) =>
      !(
        getCartItemProductId(item) === productId &&
        item.size === String(size || "").trim() &&
        item.color === String(color || "").trim() &&
        item.fit === (["Oversize", "Regular"].includes(fit) ? fit : "")
      )
  );

  await cart.save();
  await cart.populate("items.productId");

  return res.json(mapCart(cart));
});

const updateCartItem = asyncHandler(async (req, res) => {
  const { productId, size = "", color = "", fit = "", quantity } = req.body;

  const cart = await getOrCreateCart(req.user._id);
  const normalizedVariant = {
    productId,
    size: String(size || "").trim(),
    color: String(color || "").trim(),
    fit: ["Oversize", "Regular"].includes(fit) ? fit : "",
  };
  const existingItem = findExistingCartItem(cart, normalizedVariant);

  if (!existingItem) {
    throw new AppError("Cart item not found", 404);
  }

  if (Number(quantity) <= 0) {
    cart.items = cart.items.filter(
      (item) =>
        !(
          getCartItemProductId(item) === normalizedVariant.productId &&
          item.size === normalizedVariant.size &&
          item.color === normalizedVariant.color &&
          item.fit === normalizedVariant.fit
        )
    );
  } else {
    existingItem.quantity = Number(quantity);
  }

  await cart.save();
  await cart.populate("items.productId");

  return res.json(mapCart(cart));
});

const syncCart = asyncHandler(async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  const cart = await getOrCreateCart(req.user._id);

  for (const item of items) {
    if (!item?.productId || Number(item.quantity) <= 0) {
      continue;
    }

    const product = await Product.findById(item.productId);

    if (!product) {
      continue;
    }

    const normalizedVariant = {
      productId: item.productId,
      size: String(item.size || "").trim(),
      color: String(item.color || "").trim(),
      fit: ["Oversize", "Regular"].includes(item.fit) ? item.fit : "",
    };
    const existingItem = findExistingCartItem(cart, normalizedVariant);

    if (existingItem) {
      existingItem.quantity += Number(item.quantity);
    } else {
      cart.items.push({
        productId: product._id,
        quantity: Number(item.quantity),
        size: normalizedVariant.size,
        color: normalizedVariant.color,
        fit: normalizedVariant.fit,
      });
    }
  }

  await cart.save();
  await cart.populate("items.productId");

  return res.json(mapCart(cart));
});

module.exports = { addToCart, getCart, removeFromCart, updateCartItem, syncCart };
