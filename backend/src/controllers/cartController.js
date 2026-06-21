const Cart = require("../models/Cart");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { resolveCheckoutItems } = require("../services/checkoutInventory");

const MAX_CART_LINES = 25;

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
  items: cart.items.filter((item) => item.productId).map((item) => ({
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

  const [resolvedItem] = await resolveCheckoutItems([
    { productId, quantity, size, color, fit },
  ]);
  const cart = await getOrCreateCart(req.user._id);
  const normalizedVariant = {
    productId: resolvedItem.productId.toString(),
    size: resolvedItem.size,
    color: resolvedItem.color,
    fit: resolvedItem.fit,
  };
  const existingItem = findExistingCartItem(cart, normalizedVariant);

  if (existingItem) {
    const nextQuantity = existingItem.quantity + resolvedItem.quantity;
    await resolveCheckoutItems([{ ...normalizedVariant, quantity: nextQuantity }]);
    existingItem.quantity = nextQuantity;
  } else {
    if (cart.items.length >= MAX_CART_LINES) {
      throw new AppError("Your cart has too many separate items", 400);
    }
    cart.items.push({
      productId: resolvedItem.productId,
      quantity: resolvedItem.quantity,
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
    const [resolvedItem] = await resolveCheckoutItems([
      { productId, quantity, size, color, fit },
    ]);
    existingItem.quantity = resolvedItem.quantity;
  }

  await cart.save();
  await cart.populate("items.productId");

  return res.json(mapCart(cart));
});

const syncCart = asyncHandler(async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  const cart = await getOrCreateCart(req.user._id);
  const currentItems = cart.items
    .filter((item) => item.productId)
    .map((item) => ({
      productId: getCartItemProductId(item),
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      fit: item.fit,
    }));
  const incomingItems = items.filter((item) => item?.productId && Number(item.quantity) > 0);
  if (currentItems.length === 0 && incomingItems.length === 0) {
    return res.json(mapCart(cart));
  }
  const resolvedItems = await resolveCheckoutItems([...currentItems, ...incomingItems]);

  cart.items = resolvedItems.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    size: item.size,
    color: item.color,
    fit: item.fit,
  }));

  await cart.save();
  await cart.populate("items.productId");

  return res.json(mapCart(cart));
});

module.exports = { addToCart, getCart, removeFromCart, updateCartItem, syncCart };
