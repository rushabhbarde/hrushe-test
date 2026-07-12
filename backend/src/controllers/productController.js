const Product = require("../models/Product");
const Order = require("../models/Order");
const SiteContent = require("../models/SiteContent");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const mongoose = require("mongoose");
const { hasAdminPermission } = require("../config/adminRoles");
const { recordAuditLog } = require("../utils/auditLog");
const {
  buildPaginationMeta,
  parsePaginationQuery,
  sendListResponse,
} = require("../utils/pagination");
const { getPaiseValue, paiseToRupees, rupeesToPaise } = require("../utils/money");
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

const isEmbeddedMedia = (value) => /^data:/i.test(String(value || "").trim());
const isUsableMediaUrl = (value) => {
  const url = String(value || "").trim();
  return Boolean(
    url &&
    !isEmbeddedMedia(url) &&
    ((url.startsWith("/") && !url.startsWith("//")) || /^https:\/\//i.test(url))
  );
};
const correctLegacyText = (value) => String(value || "").replace(/\bbegie\b/gi, "Beige");
const correctLegacySlug = (value) => String(value || "").replace(/begie/gi, "beige");

const assertNoEmbeddedMedia = (payload = {}) => {
  const values = [
    ...(Array.isArray(payload.images) ? payload.images : []),
    ...(Array.isArray(payload.galleryImages) ? payload.galleryImages : []),
    ...(Array.isArray(payload.videos)
      ? payload.videos.flatMap((video) => [video?.url, video?.posterUrl])
      : []),
    ...(Array.isArray(payload.reviews) ? payload.reviews.map((review) => review?.photo) : []),
    payload.photo,
  ];

  if (values.some((value) => value && !isUsableMediaUrl(value))) {
    throw new AppError("Media must use an uploaded HTTPS or site-relative URL.", 400);
  }
};

const PRODUCT_DETAIL_FIELDS = [
  "fabric",
  "gsm",
  "cottonType",
  "feel",
  "weight",
  "washCare",
  "qualityNote",
  "fitNote",
  "modelHeight",
  "modelWornSize",
];
const PRODUCT_STATUSES = [
  "Active",
  "Draft",
  "Hidden",
  "Sold Out",
  "active",
  "draft",
  "hidden",
  "archived",
  "sold_out",
];
const PRODUCT_FIT_TYPES = ["Oversized", "Regular", ""];
const PRODUCT_GENDERS = ["Men", "Women", "Unisex", ""];
const PRODUCT_COLLECTION_LABELS = ["New In", "Featured", "Collection"];

const normalizeOptionalText = (value) =>
  typeof value === "string" ? value.trim() : "";

const normalizeStatusKey = (status) => {
  const normalized = String(status || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (!normalized) {
    return "active";
  }

  if (normalized === "sold_out") {
    return "sold_out";
  }

  return normalized;
};

const isActiveStatus = (status) =>
  !status || ["active"].includes(normalizeStatusKey(status));

const isSoldOutStatus = (status) => normalizeStatusKey(status) === "sold_out";
const isArchivedStatus = (status) => normalizeStatusKey(status) === "archived";

const normalizeSku = (value) => normalizeOptionalText(value).toUpperCase();

const parseNonNegativeInteger = (value, label, defaultValue = 0) => {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new AppError(`${label} must be a non-negative whole number`, 400);
  }

  return parsed;
};

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

const normalizeProductVariants = (value, { existingVariants = [], preserveReserved = false } = {}) => {
  if (!Array.isArray(value)) {
    return [];
  }

  const existingBySku = new Map(
    existingVariants
      .map((variant) => [normalizeSku(variant?.sku), variant])
      .filter(([sku]) => sku)
  );

  const normalizedVariants = value
    .map((variant) => {
      const sku = normalizeSku(variant?.sku);
      const submittedReserved = variant?.reserved;

      if (submittedReserved !== undefined && submittedReserved !== null && submittedReserved !== "") {
        parseNonNegativeInteger(submittedReserved, "Reserved stock");
      }

      return {
        sku,
        size: normalizeOptionalText(variant?.size),
        color: normalizeOptionalText(variant?.color),
        fit: normalizeOptionalText(variant?.fit),
        stock: parseNonNegativeInteger(variant?.stock, "Stock"),
        reserved: preserveReserved
          ? parseNonNegativeInteger(existingBySku.get(sku)?.reserved, "Reserved stock")
          : 0,
        active: variant?.active !== false,
      };
    })
    .filter((variant) => variant.sku);

  if (preserveReserved) {
    const nextSkus = new Set(normalizedVariants.map((variant) => variant.sku));
    const removedReservedVariant = existingVariants.find(
      (variant) => normalizeSku(variant?.sku) && Number(variant?.reserved || 0) > 0 && !nextSkus.has(normalizeSku(variant.sku))
    );

    if (removedReservedVariant) {
      throw new AppError(
        "Variants with active reserved inventory cannot be removed or have their SKU changed.",
        409
      );
    }
  }

  return normalizedVariants;
};

const isApprovedReview = (review) =>
  review?.status === "approved" && review?.verifiedPurchase === true;

const canViewUnpublishedProducts = (req) =>
  req.query?.admin === "true" &&
  req.user?.role === "admin" &&
  hasAdminPermission(req.user, "products.view");

const publicProductConditions = [
  { $or: [{ status: { $in: ["Active", "active"] } }, { status: { $exists: false } }] },
  { name: { $not: /^test(?:\s|$)/i } },
];

const normalizeProductPayload = (
  payload,
  { partial = false, existingVariants = [], preserveReserved = false } = {}
) => {
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
    normalized.pricePaise = payload.pricePaise !== undefined
      ? payload.pricePaise
      : rupeesToPaise(payload.price);
  } else if (payload.pricePaise !== undefined) {
    normalized.pricePaise = payload.pricePaise;
    normalized.price = paiseToRupees(payload.pricePaise);
  }

  if (!partial || payload.compareAtPrice !== undefined) {
    normalized.compareAtPrice = payload.compareAtPrice;
    normalized.compareAtPricePaise =
      payload.compareAtPrice !== undefined && payload.compareAtPrice !== null
        ? rupeesToPaise(payload.compareAtPrice)
        : undefined;
  } else if (payload.compareAtPricePaise !== undefined) {
    normalized.compareAtPricePaise = payload.compareAtPricePaise;
    normalized.compareAtPrice = paiseToRupees(payload.compareAtPricePaise);
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
    if (normalized.status !== "archived") {
      normalized.archivedAt = null;
      normalized.archivedFromStatus = "";
    }
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
    normalized.variants = normalizeProductVariants(payload.variants, {
      existingVariants,
      preserveReserved,
    });
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

  if (!partial || payload.returnEligible !== undefined) {
    normalized.returnEligible = payload.returnEligible === true;
  }

  return normalized;
};

const getAvailability = (product) => {
  if (isSoldOutStatus(product.status)) {
    return "sold-out";
  }

  if (!product.trackInventory) {
    return "available";
  }

  return product.variants?.some((variant) => variant.active !== false && variant.stock > 0)
    ? "available"
    : "sold-out";
};

const getValidCompareAtPrice = (product) =>
  getPaiseValue(product, "compareAtPricePaise", "compareAtPrice") >
  getPaiseValue(product, "pricePaise", "price")
    ? paiseToRupees(getPaiseValue(product, "compareAtPricePaise", "compareAtPrice"))
    : undefined;

const mapPublicProductListItem = (product) => ({
  id: product._id.toString(),
  slug: correctLegacySlug(product.slug),
  displayName: correctLegacyText(product.name),
  colour: correctLegacyText(product.colors?.[0] || ""),
  price: paiseToRupees(getPaiseValue(product, "pricePaise", "price")),
  pricePaise: getPaiseValue(product, "pricePaise", "price"),
  ...(getValidCompareAtPrice(product) ? { compareAtPrice: getValidCompareAtPrice(product) } : {}),
  thumbnailUrl: (product.images || []).find(isUsableMediaUrl) || "",
  availability: getAvailability(product),
  featured: Boolean(product.featured),
  bestSeller: Boolean(product.bestSeller),
  newIn: Boolean(product.newIn),
  newArrival: Boolean(product.newArrival),
});

const mapAdminProductListItem = (product) => ({
  ...product,
  id: product._id.toString(),
  _id: undefined,
  name: correctLegacyText(product.name),
  slug: correctLegacySlug(product.slug),
  images: (product.images || []).filter(isUsableMediaUrl).slice(0, 2),
  galleryImages: (product.galleryImages || []).filter(isUsableMediaUrl).slice(0, 1),
  videos: (product.videos || []).filter((video) => isUsableMediaUrl(video?.url)),
  reviews: [],
});

const assertActiveProductIsComplete = (product) => {
  if (!isActiveStatus(product.status)) {
    return;
  }

  const variants = Array.isArray(product.variants) ? product.variants : [];
  const missing = [];
  if (!String(product.name || "").trim()) missing.push("name");
  if (!String(product.slug || "").trim()) missing.push("slug");
  if (!String(product.description || "").trim()) missing.push("factual description");
  if (!(getPaiseValue(product, "pricePaise", "price") > 0)) missing.push("price");
  if (!String(product.category || "").trim()) missing.push("category");
  if (!Array.isArray(product.colors) || product.colors.length === 0) missing.push("colour");
  if (!Array.isArray(product.sizes) || product.sizes.length === 0) missing.push("size options");
  if (!product.trackInventory) missing.push("inventory enabled");
  if (!variants.some((variant) => variant.active !== false && variant.stock > 0 && variant.sku)) {
    missing.push("available stock with SKU");
  }
  if (!(product.images || []).some(isUsableMediaUrl)) missing.push("uploaded image URL");
  if (!String(product.fabric || product.cottonType || "").trim()) missing.push("fabric/composition");
  if (!String(product.gsm || product.weight || "").trim()) missing.push("GSM or weight note");
  if (!String(product.washCare || "").trim()) missing.push("care instructions");
  if (product.returnEligible !== true) missing.push("return eligibility");

  if (missing.length > 0) {
    throw new AppError(`Active products require: ${missing.join(", ")}.`, 400);
  }
};

const clearProductListCache = () => {
  productListCache.clear();
};

const getProductDetailResponse = async (product, { includePrivate = false } = {}) => {
  const productData = product.toJSON ? product.toJSON() : product;
  const reviews = Array.isArray(productData.reviews)
    ? productData.reviews.filter((review) => includePrivate || isApprovedReview(review))
    : [];

  const sanitizedProduct = {
    ...productData,
    name: correctLegacyText(productData.name),
    slug: correctLegacySlug(productData.slug),
    price: paiseToRupees(getPaiseValue(productData, "pricePaise", "price")),
    compareAtPrice: getValidCompareAtPrice(productData),
    pricePaise: getPaiseValue(productData, "pricePaise", "price"),
    images: (productData.images || []).filter(isUsableMediaUrl),
    galleryImages: (productData.galleryImages || []).filter(isUsableMediaUrl),
    videos: (productData.videos || [])
      .filter((video) => isUsableMediaUrl(video?.url))
      .map((video) => ({
        ...video,
        posterUrl: isUsableMediaUrl(video.posterUrl) ? video.posterUrl : "",
      })),
    reviews: reviews.map((review) => ({
      ...review,
      photo: isUsableMediaUrl(review.photo) ? review.photo : "",
    })),
  };

  if (!includePrivate) {
    sanitizedProduct.variants = (productData.variants || []).map((variant) => ({
      size: variant.size,
      color: variant.color,
      fit: variant.fit || "",
      stock: variant.active !== false && Number(variant.stock) > 0 ? 1 : 0,
      active: variant.active !== false,
    }));
    sanitizedProduct.reviews = sanitizedProduct.reviews.map((review) => ({
      id: review.id || review._id?.toString(),
      reviewerName: review.reviewerName,
      quote: review.quote,
      rating: review.rating,
      photo: review.photo,
      status: review.status,
      verifiedPurchase: true,
      createdAt: review.createdAt,
    }));
  }

  if (sanitizedProduct.galleryImages.length > 0) {
    return sanitizedProduct;
  }

  const content = await SiteContent.findOne({ key: "main" }).lean();
  const galleryImages =
    content?.adminWorkspace?.productMeta?.[productData.id]?.galleryImages;

  return {
    ...sanitizedProduct,
    galleryImages: Array.isArray(galleryImages)
      ? galleryImages.filter(isUsableMediaUrl)
      : [],
  };
};

const getProducts = asyncHandler(async (req, res) => {
  const includePrivate = canViewUnpublishedProducts(req);
  const { category, featured, bestSeller, newIn, newArrival, q } = req.query;
  const paginationParams = parsePaginationQuery(req.query, {
    defaultLimit: includePrivate ? 50 : 100,
    maxLimit: 100,
  });
  const cacheKey = JSON.stringify({
    category: category || "",
    featured: featured || "",
    bestSeller: bestSeller || "",
    newIn: newIn || "",
    newArrival: newArrival || "",
    q: q || "",
    includePrivate,
    page: paginationParams.page,
    limit: paginationParams.limit,
  });
  const cached = productListCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < PRODUCT_LIST_CACHE_TTL) {
    res.set(
      "Cache-Control",
      includePrivate ? "private, no-store" : "public, max-age=60, stale-while-revalidate=300"
    );
    return sendListResponse(res, req.query, cached.data, cached.pagination);
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
    const searchRegex = new RegExp(escapeRegex(String(q).trim().slice(0, 100)), "i");
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

  const [products, total] = await Promise.all([
    Product.find(query)
      .sort({ createdAt: -1, name: 1 })
      .skip(paginationParams.skip)
      .limit(paginationParams.limit)
      .lean(),
    Product.countDocuments(query),
  ]);
  const pagination = buildPaginationMeta({
    page: paginationParams.page,
    limit: paginationParams.limit,
    total,
  });
  const data = products.map((product) =>
    includePrivate ? mapAdminProductListItem(product) : mapPublicProductListItem(product)
  );

  productListCache.set(cacheKey, {
    timestamp: Date.now(),
    data,
    pagination,
  });

  res.set(
    "Cache-Control",
    includePrivate ? "private, no-store" : "public, max-age=60, stale-while-revalidate=300"
  );
  return sendListResponse(res, req.query, data, pagination);
});

const getProductSitemapEntries = asyncHandler(async (req, res) => {
  const products = await Product.find({ $and: publicProductConditions })
    .select("slug category categories updatedAt")
    .sort({ updatedAt: -1 })
    .lean();

  const entries = products.map((product) => ({
    id: product._id.toString(),
    slug: correctLegacySlug(product.slug || ""),
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
  const normalizedId = String(id || "").toLowerCase();
  const legacyId = normalizedId.replace(/beige/g, "begie");
  const correctedId = normalizedId.replace(/begie/g, "beige");
  const slugCandidates = Array.from(new Set([normalizedId, legacyId, correctedId]));
  const includePrivate = canViewUnpublishedProducts(req);
  const visibilityQuery = includePrivate ? {} : { $and: publicProductConditions };
  const product = mongoose.Types.ObjectId.isValid(id)
    ? await Product.findOne({
        $and: [
          { $or: [{ _id: id }, { slug: { $in: slugCandidates } }] },
          visibilityQuery,
        ],
      })
    : await Product.findOne({ $and: [{ slug: { $in: slugCandidates } }, visibilityQuery] });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  res.set(
    "Cache-Control",
    includePrivate ? "private, no-store" : "public, max-age=60, stale-while-revalidate=300"
  );
  return res.json(await getProductDetailResponse(product, { includePrivate }));
});

const createProduct = asyncHandler(async (req, res) => {
  assertNoEmbeddedMedia(req.body);
  const product = new Product(normalizeProductPayload(req.body));
  assertActiveProductIsComplete(product);
  await product.save();
  clearProductListCache();
  await recordAuditLog(req, product.status === "Active" ? "product.publish" : "product.create", {
    type: "product",
    id: product._id,
  }, { price: product.price, status: product.status });
  return res.status(201).json(product);
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  assertNoEmbeddedMedia(req.body);
  const query = mongoose.Types.ObjectId.isValid(id)
    ? { $or: [{ _id: id }, { slug: id.toLowerCase() }] }
    : { slug: id.toLowerCase() };
  const product = await Product.findOne(query);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const update = normalizeProductPayload(req.body, {
    partial: true,
    existingVariants: product.variants || [],
    preserveReserved: true,
  });
  const previousPrice = product.price;
  const previousStatus = product.status;
  Object.assign(product, update);
  assertActiveProductIsComplete(product);
  await product.save();
  clearProductListCache();

  if (previousPrice !== product.price) {
    await recordAuditLog(req, "product.price-change", { type: "product", id: product._id }, {
      before: previousPrice,
      after: product.price,
    });
  }
  if (previousStatus !== "Active" && product.status === "Active") {
    await recordAuditLog(req, "product.publish", { type: "product", id: product._id }, {
      previousStatus,
    });
  }

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
  assertNoEmbeddedMedia({ photo });

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

  if (!verifiedPurchase) {
    throw new AppError("Reviews can only be submitted for a paid purchase of this product", 403);
  }

  product.reviews.unshift({
    userId: req.user?._id || null,
    reviewerName: String(reviewerName).trim(),
    quote: String(quote).trim(),
    rating: Number(rating) >= 1 && Number(rating) <= 5 ? Number(rating) : 5,
    photo: isUsableMediaUrl(photo) ? String(photo).trim() : "",
    status: "pending",
    verifiedPurchase,
  });

  await product.save();
  clearProductListCache();

  return res.status(201).json(await getProductDetailResponse(product));
});

const getAdminProductReviews = asyncHandler(async (req, res) => {
  const paginationParams = parsePaginationQuery(req.query, {
    defaultLimit: 50,
    maxLimit: 100,
  });
  const match = { "reviews.0": { $exists: true } };
  const [rows, totals] = await Promise.all([
    Product.aggregate([
      { $match: match },
      { $unwind: "$reviews" },
      { $sort: { "reviews.createdAt": -1, updatedAt: -1 } },
      { $skip: paginationParams.skip },
      { $limit: paginationParams.limit },
      {
        $project: {
          productId: { $toString: "$_id" },
          productName: "$name",
          review: {
            id: { $toString: "$reviews._id" },
            reviewerName: "$reviews.reviewerName",
            quote: "$reviews.quote",
            rating: "$reviews.rating",
            photo: "$reviews.photo",
            status: { $ifNull: ["$reviews.status", "approved"] },
            verifiedPurchase: "$reviews.verifiedPurchase",
            createdAt: "$reviews.createdAt",
          },
        },
      },
    ]),
    Product.aggregate([
      { $match: match },
      { $unwind: "$reviews" },
      { $count: "total" },
    ]),
  ]);
  const pagination = buildPaginationMeta({
    page: paginationParams.page,
    limit: paginationParams.limit,
    total: totals[0]?.total || 0,
  });
  const reviews = rows.map((row) => ({
    productId: row.productId,
    productName: correctLegacyText(row.productName),
    review: {
      ...row.review,
      photo: isUsableMediaUrl(row.review?.photo) ? row.review.photo : "",
      verifiedPurchase: Boolean(row.review?.verifiedPurchase),
    },
  }));

  return res.json({ reviews, pagination });
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

  if (status === "approved" && review.verifiedPurchase !== true) {
    throw new AppError("Only verified-purchase reviews can be approved", 400);
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
  const product = await Product.findOne(query);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const hasReservedInventory = (product.variants || []).some(
    (variant) => Number(variant?.reserved || 0) > 0
  );

  if (hasReservedInventory) {
    throw new AppError("Products with active reserved inventory cannot be archived.", 409);
  }

  if (!isArchivedStatus(product.status)) {
    product.archivedFromStatus = product.status || "Draft";
    product.status = "archived";
    product.archivedAt = new Date();
    await product.save();
    await recordAuditLog(req, "product.archive", { type: "product", id: product._id }, {
      archivedFromStatus: product.archivedFromStatus,
    });
  }
  clearProductListCache();

  return res.json({ message: "Product archived successfully", product });
});

const restoreProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const query = mongoose.Types.ObjectId.isValid(id)
    ? { $or: [{ _id: id }, { slug: id.toLowerCase() }] }
    : { slug: id.toLowerCase() };
  const product = await Product.findOne(query);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (!isArchivedStatus(product.status)) {
    return res.json({ message: "Product is already active in the catalog lifecycle.", product });
  }

  const nextStatus = PRODUCT_STATUSES.includes(product.archivedFromStatus)
    ? product.archivedFromStatus
    : "Draft";
  product.status = isArchivedStatus(nextStatus) ? "Draft" : nextStatus;
  product.archivedAt = null;
  product.archivedFromStatus = "";
  assertActiveProductIsComplete(product);
  await product.save();
  clearProductListCache();
  await recordAuditLog(req, "product.restore", { type: "product", id: product._id }, {
    status: product.status,
  });

  return res.json({ message: "Product restored successfully", product });
});

const permanentlyDeleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const confirmation = String(req.body?.confirmation || req.query?.confirmation || "").trim();

  if (confirmation !== "DELETE_PERMANENTLY") {
    throw new AppError("Permanent deletion requires confirmation.", 400);
  }

  const query = mongoose.Types.ObjectId.isValid(id)
    ? { $or: [{ _id: id }, { slug: id.toLowerCase() }] }
    : { slug: id.toLowerCase() };
  const product = await Product.findOne(query);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const [referencedOrder, hasReservedInventory] = await Promise.all([
    Order.exists({ "products.productId": product._id }),
    Promise.resolve(
      (product.variants || []).some((variant) => Number(variant?.reserved || 0) > 0)
    ),
  ]);

  if (referencedOrder) {
    throw new AppError("Products referenced by orders cannot be permanently deleted.", 409);
  }

  if (hasReservedInventory) {
    throw new AppError("Products with active reserved inventory cannot be permanently deleted.", 409);
  }

  await product.deleteOne();
  clearProductListCache();
  await recordAuditLog(req, "product.permanent-delete", { type: "product", id: product._id }, {
    slug: product.slug,
    name: product.name,
  });

  return res.json({ message: "Product permanently deleted." });
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
  restoreProduct,
  permanentlyDeleteProduct,
  __private: {
    isArchivedStatus,
    isActiveStatus,
    normalizeProductPayload,
    normalizeProductVariants,
  },
};
