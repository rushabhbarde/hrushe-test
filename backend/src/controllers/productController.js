const Product = require("../models/Product");
const Order = require("../models/Order");
const SiteContent = require("../models/SiteContent");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const mongoose = require("mongoose");
const { hasAdminPermission } = require("../config/adminRoles");
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

const normalizeProductVideos = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((video, index) => {
      const url = String(video?.url || "").trim();

      if (!url) {
        return null;
      }

      if (/^data:video\//i.test(url)) {
        throw new AppError(
          "Video files must be uploaded through media storage. Remove and re-upload the video, then save again.",
          400
        );
      }

      return {
        id: String(video?.id || `video-${Date.now()}-${index}`).trim(),
        title: String(video?.title || `Product video ${index + 1}`).trim(),
        url,
        posterUrl: String(video?.posterUrl || "").trim(),
      };
    })
    .filter(Boolean);
};

const PRODUCT_DETAIL_FIELDS = [
  "fabric",
  "gsm",
  "cottonType",
  "feel",
  "weight",
  "washCare",
  "qualityNote",
];
const PRODUCT_STATUSES = ["Active", "Draft", "Hidden", "Sold Out"];
const PRODUCT_FIT_TYPES = ["Oversized", "Regular", ""];
const PRODUCT_GENDERS = ["Men", "Women", "Unisex", ""];
const PRODUCT_COLLECTION_LABELS = ["New In", "Featured", "Collection"];

const normalizeOptionalText = (value) =>
  typeof value === "string" ? value.trim() : "";

const normalizeProductSizeGuide = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((row) => ({
      size: normalizeOptionalText(row?.size),
      chest: normalizeOptionalText(row?.chest),
      length: normalizeOptionalText(row?.length),
      shoulder: normalizeOptionalText(row?.shoulder),
      sleeve: normalizeOptionalText(row?.sleeve),
    }))
    .filter(
      (row) =>
        row.size &&
        (row.chest || row.length || row.shoulder || row.sleeve)
    );
};

const normalizeProductVariants = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((variant) => ({
      sku: normalizeOptionalText(variant?.sku).toUpperCase(),
      size: normalizeOptionalText(variant?.size),
      color: normalizeOptionalText(variant?.color),
      fit: normalizeOptionalText(variant?.fit),
      stock: Math.max(0, Number.parseInt(variant?.stock, 10) || 0),
      reserved: Math.max(0, Number.parseInt(variant?.reserved, 10) || 0),
      active: variant?.active !== false,
    }))
    .filter((variant) => variant.sku);
};

const isApprovedReview = (review) =>
  !review?.status || review.status === "approved";

const canViewUnpublishedProducts = (req) =>
  req.user?.role === "admin" && hasAdminPermission(req.user, "products.view");

const publicProductConditions = [
  { $or: [{ status: "Active" }, { status: { $exists: false } }] },
  { name: { $not: /^test(?:\s|$)/i } },
];

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

  if (!partial || payload.galleryImages !== undefined) {
    normalized.galleryImages = Array.isArray(payload.galleryImages)
      ? payload.galleryImages
      : [];
  }

  if (!partial || payload.status !== undefined) {
    normalized.status = PRODUCT_STATUSES.includes(payload.status)
      ? payload.status
      : "Draft";
  }

  if (!partial || payload.fitType !== undefined) {
    normalized.fitType = PRODUCT_FIT_TYPES.includes(payload.fitType)
      ? payload.fitType
      : "";
  }

  if (!partial || payload.gender !== undefined) {
    normalized.gender = PRODUCT_GENDERS.includes(payload.gender)
      ? payload.gender
      : "Unisex";
  }

  if (!partial || payload.collectionLabels !== undefined) {
    normalized.collectionLabels = Array.isArray(payload.collectionLabels)
      ? payload.collectionLabels.filter((label) => PRODUCT_COLLECTION_LABELS.includes(label))
      : [];
  }

  if (!partial || payload.trackInventory !== undefined) {
    normalized.trackInventory = Boolean(payload.trackInventory);
  }

  if (!partial || payload.variants !== undefined) {
    normalized.variants = normalizeProductVariants(payload.variants);
  }

  PRODUCT_DETAIL_FIELDS.forEach((field) => {
    if (!partial || payload[field] !== undefined) {
      normalized[field] = normalizeOptionalText(payload[field]);
    }
  });

  if (!partial || payload.sizeGuide !== undefined) {
    normalized.sizeGuide = normalizeProductSizeGuide(payload.sizeGuide);
  }

  if (!partial || payload.videos !== undefined) {
    normalized.videos = normalizeProductVideos(payload.videos);
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

const mapProductListItem = (product, { includePrivate = false } = {}) => ({
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
  images: Array.isArray(product.images) ? product.images.slice(0, 2) : [],
  galleryImages: Array.isArray(product.galleryImages)
    ? product.galleryImages.slice(0, 1)
    : [],
  status: product.status || "Active",
  fitType: product.fitType || "",
  gender: product.gender || "Unisex",
  collectionLabels: Array.isArray(product.collectionLabels)
    ? product.collectionLabels
    : [],
  trackInventory: Boolean(product.trackInventory),
  variants: Array.isArray(product.variants)
    ? product.variants.map((variant) =>
        includePrivate
          ? variant
          : {
              size: variant.size,
              color: variant.color,
              fit: variant.fit,
              stock: variant.stock > 0 ? 1 : 0,
              active: variant.active !== false,
            }
      )
    : [],
  fabric: product.fabric || "",
  gsm: product.gsm || "",
  cottonType: product.cottonType || "",
  feel: product.feel || "",
  weight: product.weight || "",
  washCare: product.washCare || "",
  qualityNote: product.qualityNote || "",
  videos: Array.isArray(product.videos) ? product.videos : [],
  featured: Boolean(product.featured),
  bestSeller: Boolean(product.bestSeller),
  newIn: Boolean(product.newIn),
  newArrival: Boolean(product.newArrival),
  reviews: Array.isArray(product.reviews)
    ? product.reviews
        .filter((review) => includePrivate || isApprovedReview(review))
        .slice(0, 2)
    : [],
  accent: product.accent,
  imageLabel: product.imageLabel,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});

const clearProductListCache = () => {
  productListCache.clear();
};

const getProductDetailResponse = async (product, { includePrivate = false } = {}) => {
  const productData = product.toJSON ? product.toJSON() : product;
  const reviews = Array.isArray(productData.reviews)
    ? productData.reviews.filter((review) => includePrivate || isApprovedReview(review))
    : [];

  if (Array.isArray(productData.galleryImages) && productData.galleryImages.length > 0) {
    return { ...productData, reviews };
  }

  const content = await SiteContent.findOne({ key: "main" }).lean();
  const galleryImages =
    content?.adminWorkspace?.productMeta?.[productData.id]?.galleryImages;

  return {
    ...productData,
    reviews,
    galleryImages: Array.isArray(galleryImages)
      ? galleryImages.filter(Boolean)
      : Array.isArray(productData.galleryImages)
        ? productData.galleryImages
        : [],
  };
};

const getProducts = asyncHandler(async (req, res) => {
  const includePrivate = canViewUnpublishedProducts(req);
  const { category, featured, bestSeller, newIn, newArrival, q } = req.query;
  const cacheKey = JSON.stringify({
    category: category || "",
    featured: featured || "",
    bestSeller: bestSeller || "",
    newIn: newIn || "",
    newArrival: newArrival || "",
    q: q || "",
    includePrivate,
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

  if (!includePrivate) {
    andConditions.push(...publicProductConditions);
  }

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
        { fabric: searchRegex },
        { gsm: searchRegex },
        { cottonType: searchRegex },
        { feel: searchRegex },
        { weight: searchRegex },
        { washCare: searchRegex },
        { qualityNote: searchRegex },
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
  const data = products.map((product) => mapProductListItem(product, { includePrivate }));

  productListCache.set(cacheKey, {
    timestamp: Date.now(),
    data,
  });

  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  return res.json(data);
});

const getProductSitemapEntries = asyncHandler(async (req, res) => {
  const products = await Product.find({ $and: publicProductConditions })
    .select("slug category categories updatedAt")
    .sort({ updatedAt: -1 })
    .lean();

  const entries = products.map((product) => ({
    id: product._id.toString(),
    slug: product.slug || "",
    category: product.category || "",
    categories:
      Array.isArray(product.categories) && product.categories.length > 0
        ? product.categories
        : product.category
          ? [product.category]
          : [],
    updatedAt: product.updatedAt,
  }));

  res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
  return res.json(entries);
});

const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const includePrivate = canViewUnpublishedProducts(req);
  const visibilityQuery = includePrivate ? {} : { $and: publicProductConditions };
  const product = mongoose.Types.ObjectId.isValid(id)
    ? await Product.findOne({
        $and: [
          { $or: [{ _id: id }, { slug: id.toLowerCase() }] },
          visibilityQuery,
        ],
      })
    : await Product.findOne({ $and: [{ slug: id.toLowerCase() }, visibilityQuery] });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  return res.json(await getProductDetailResponse(product, { includePrivate }));
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

  if (String(reviewerName).trim().length > 80 || String(quote).trim().length > 1200) {
    throw new AppError("Review content is too long", 400);
  }

  const verifiedPurchase = req.user
    ? Boolean(
        await Order.exists({
          userId: req.user._id,
          "products.productId": product._id,
          paymentStatus: "paid",
        })
      )
    : false;

  product.reviews.unshift({
    userId: req.user?._id || null,
    reviewerName: String(reviewerName).trim(),
    quote: String(quote).trim(),
    rating: Number(rating) >= 1 && Number(rating) <= 5 ? Number(rating) : 5,
    photo: typeof photo === "string" ? photo : "",
    status: "pending",
    verifiedPurchase,
  });

  await product.save();
  clearProductListCache();

  return res.status(201).json(await getProductDetailResponse(product));
});

const getAdminProductReviews = asyncHandler(async (req, res) => {
  const products = await Product.find({ "reviews.0": { $exists: true } })
    .select("name reviews")
    .sort({ updatedAt: -1 })
    .lean();

  const reviews = products.flatMap((product) =>
    product.reviews.map((review) => ({
      productId: product._id.toString(),
      productName: product.name,
      review: {
        id: review._id.toString(),
        reviewerName: review.reviewerName,
        quote: review.quote,
        rating: review.rating,
        photo: review.photo,
        status: review.status || "approved",
        verifiedPurchase: Boolean(review.verifiedPurchase),
        createdAt: review.createdAt,
      },
    }))
  );

  return res.json({ reviews });
});

const updateProductReviewStatus = asyncHandler(async (req, res) => {
  const { id, reviewId } = req.params;
  const { status } = req.body;

  if (!["approved", "rejected", "hidden"].includes(status)) {
    throw new AppError("Invalid review status", 400);
  }

  const product = await Product.findById(id);
  const review = product?.reviews.id(reviewId);

  if (!product || !review) {
    throw new AppError("Review not found", 404);
  }

  review.status = status;
  await product.save();
  clearProductListCache();

  return res.json({
    message: `Review marked as ${status}`,
    review: {
      id: review._id.toString(),
      status: review.status,
    },
  });
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
  getProductSitemapEntries,
  getProductById,
  createProduct,
  updateProduct,
  addProductReview,
  getAdminProductReviews,
  updateProductReviewStatus,
  deleteProduct,
};
