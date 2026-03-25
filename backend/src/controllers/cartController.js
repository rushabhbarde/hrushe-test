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

const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, size = "" } = req.body;

  if (!productId) {
    throw new AppError("Product is required", 400);
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const cart = await getOrCreateCart(req.user._id);
  const existingItem = cart.items.find(
    (item) => item.productId._id.toString() === productId && item.size === size
  );

  if (existingItem) {
    existingItem.quantity += Number(quantity);
  } else {
    cart.items.push({
      productId,
      quantity: Number(quantity),
      size,
    });
  }

  await cart.save();
  await cart.populate("items.productId");

  return res.status(201).json(cart);
});

const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  return res.json(cart);
});

const removeFromCart = asyncHandler(async (req, res) => {
  const { productId, size = "" } = req.body;

  const cart = await getOrCreateCart(req.user._id);
  cart.items = cart.items.filter(
    (item) =>
      !(item.productId._id.toString() === productId && item.size === size)
  );

  await cart.save();
  await cart.populate("items.productId");

  return res.json(cart);
});

module.exports = { addToCart, getCart, removeFromCart };
