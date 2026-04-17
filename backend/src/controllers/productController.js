const Product = require("../models/Product");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const mongoose = require("mongoose");

const parseBooleanQuery = (value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
};

const normalizeProductPayload = (payload, { partial = false } = {}) => {
  const normalized = {};

  if (!partial || payload.name !== undefined) {
    normalized.name = payload.name;
  }

  if (!partial || payload.slug !== undefined) {
    normalized.slug = payload.slug;
  }

  if (!partial || payload.description !== undefined) {
    normalized.description = payload.description;
  }

  if (!partial || payload.price !== undefined) {
    normalized.price = payload.price;
  }

  if (!partial || payload.compareAtPrice !== undefined) {
    normalized.compareAtPrice = payload.compareAtPrice;
  }

  if (!partial || payload.category !== undefined) {
    normalized.category = payload.category;
  }

  if (!partial || payload.sizes !== undefined) {
    normalized.sizes = Array.isArray(payload.sizes) ? payload.sizes : [];
  }

  if (!partial || payload.colors !== undefined) {
    normalized.colors = Array.isArray(payload.colors) ? payload.colors : [];
  }

  if (!partial || payload.images !== undefined) {
    normalized.images = Array.isArray(payload.images) ? payload.images : [];
  }

  if (!partial || payload.featured !== undefined) {
    normalized.featured = Boolean(payload.featured);
  }

  if (!partial || payload.bestSeller !== undefined) {
    normalized.bestSeller = Boolean(payload.bestSeller);
  }

  if (!partial || payload.newIn !== undefined) {
    normalized.newIn = Boolean(payload.newIn);
  }

  if (!partial || payload.newArrival !== undefined) {
    normalized.newArrival = Boolean(payload.newArrival);
  }

  if (!partial || payload.reviews !== undefined) {
    normalized.reviews = Array.isArray(payload.reviews) ? payload.reviews : [];
  }

  return normalized;
};

const getProducts = asyncHandler(async (req, res) => {
  const { category, featured, bestSeller, newIn, newArrival, q } = req.query;
  const query = {};
  const featuredFilter = parseBooleanQuery(featured);
  const bestSellerFilter = parseBooleanQuery(bestSeller);
  const newInFilter = parseBooleanQuery(newIn);
  const newArrivalFilter = parseBooleanQuery(newArrival);

  if (category) {
    query.category = { $regex: `^${category}$`, $options: "i" };
  }

  if (featuredFilter !== undefined) {
    query.featured = featuredFilter;
  }

  if (bestSellerFilter !== undefined) {
    query.bestSeller = bestSellerFilter;
  }

  if (newInFilter !== undefined) {
    query.newIn = newInFilter;
  }

  if (newArrivalFilter !== undefined) {
    query.newArrival = newArrivalFilter;
  }

  if (q) {
    const searchRegex = new RegExp(q.trim(), "i");
    query.$or = [
      { name: searchRegex },
      { description: searchRegex },
      { category: searchRegex },
      { colors: searchRegex },
      { slug: searchRegex },
    ];
  }

  const products = await Product.find(query).sort({ createdAt: -1, name: 1 });
  return res.json(products);
});

const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = mongoose.Types.ObjectId.isValid(id)
    ? await Product.findOne({
        $or: [{ _id: id }, { slug: id.toLowerCase() }],
      })
    : await Product.findOne({ slug: id.toLowerCase() });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return res.json(product);
});

const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(normalizeProductPayload(req.body));
  return res.status(201).json(product);
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const update = normalizeProductPayload(req.body, { partial: true });
  const query = mongoose.Types.ObjectId.isValid(id)
    ? { $or: [{ _id: id }, { slug: id.toLowerCase() }] }
    : { slug: id.toLowerCase() };
  const product = await Product.findOne(query);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  Object.assign(product, update);
  await product.save();

  return res.json(product);
});

const addProductReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const query = mongoose.Types.ObjectId.isValid(id)
    ? { $or: [{ _id: id }, { slug: id.toLowerCase() }] }
    : { slug: id.toLowerCase() };
  const product = await Product.findOne(query);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const { reviewerName, quote, rating, photo } = req.body;

  if (!reviewerName || !quote) {
    throw new AppError("Name and review are required", 400);
  }

  product.reviews.unshift({
    reviewerName: String(reviewerName).trim(),
    quote: String(quote).trim(),
    rating: Number(rating) >= 1 && Number(rating) <= 5 ? Number(rating) : 5,
    photo: typeof photo === "string" ? photo : "",
  });

  await product.save();

  return res.status(201).json(product);
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const query = mongoose.Types.ObjectId.isValid(id)
    ? { $or: [{ _id: id }, { slug: id.toLowerCase() }] }
    : { slug: id.toLowerCase() };
  const product = await Product.findOneAndDelete(query);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return res.json({ message: "Product deleted successfully" });
});

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  addProductReview,
  deleteProduct,
};
