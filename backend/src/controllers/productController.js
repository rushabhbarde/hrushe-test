const Product = require("../models/Product");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const mongoose = require("mongoose");
const productListCache = new Map();
const PRODUCT_LIST_CACHE_TTL = 60 * 1000;

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeCategories = (value) => {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((item) => String(item || "").trim())
          .filter(Boolean)
      )
    );
  }

  if (typeof value === "string") {
    return Array.from(
      new Set(
        value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      )
    );
  }

  return [];
};

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

  if (
    !partial ||
    payload.category !== undefined ||
    payload.categories !== undefined
  ) {
    const normalizedCategories =
      payload.categories !== undefined
        ? normalizeCategories(payload.categories)
        : normalizeCategories(payload.category);

    normalized.categories = normalizedCategories;
    normalized.category =
      normalizedCategories[0] ||
      (typeof payload.category === "string" ? payload.category.trim() : payload.category);
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

const mapProductListItem = (product) => ({
  id: product._id.toString(),
  name: product.name,
  slug: product.slug,
  description: product.description,
  price: product.price,
  compareAtPrice: product.compareAtPrice,
  category: product.category,
  categories:
    Array.isArray(product.categories) && product.categories.length > 0
      ? product.categories
      : product.category
        ? [product.category]
        : [],
  sizes: Array.isArray(product.sizes) ? product.sizes : [],
  colors: Array.isArray(product.colors) ? product.colors : [],
  images: Array.isArray(product.images) ? product.images.slice(0, 1) : [],
  featured: Boolean(product.featured),
  bestSeller: Boolean(product.bestSeller),
  newIn: Boolean(product.newIn),
  newArrival: Boolean(product.newArrival),
  reviews: Array.isArray(product.reviews) ? product.reviews.slice(0, 2) : [],
  accent: product.accent,
  imageLabel: product.imageLabel,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});

const clearProductListCache = () => {
  productListCache.clear();
};

const getProducts = asyncHandler(async (req, res) => {
  const { category, featured, bestSeller, newIn, newArrival, q } = req.query;
  const cacheKey = JSON.stringify({
    category: category || "",
    featured: featured || "",
    bestSeller: bestSeller || "",
    newIn: newIn || "",
    newArrival: newArrival || "",
    q: q || "",
  });
  const cached = productListCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < PRODUCT_LIST_CACHE_TTL) {
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    return res.json(cached.data);
  }

  const query = {};
  const andConditions = [];
  const featuredFilter = parseBooleanQuery(featured);
  const bestSellerFilter = parseBooleanQuery(bestSeller);
  const newInFilter = parseBooleanQuery(newIn);
  const newArrivalFilter = parseBooleanQuery(newArrival);

  if (category) {
    const categoryRegex = new RegExp(`^${escapeRegex(category)}$`, "i");
    andConditions.push({
      $or: [
        { category: categoryRegex },
        { categories: { $elemMatch: { $regex: categoryRegex } } },
      ],
    });
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
    andConditions.push({
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { categories: searchRegex },
        { colors: searchRegex },
        { slug: searchRegex },
      ],
    });
  }

  if (andConditions.length === 1) {
    Object.assign(query, andConditions[0]);
  } else if (andConditions.length > 1) {
    query.$and = andConditions;
  }

  const products = await Product.find(query)
    .sort({ createdAt: -1, name: 1 })
    .lean();
  const data = products.map(mapProductListItem);

  productListCache.set(cacheKey, {
    timestamp: Date.now(),
    data,
  });

  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  return res.json(data);
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

  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  return res.json(product);
});

const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(normalizeProductPayload(req.body));
  clearProductListCache();
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
  clearProductListCache();

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
  clearProductListCache();

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

  clearProductListCache();

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
