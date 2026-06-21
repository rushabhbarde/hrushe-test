const express = require("express");
const {
  getProducts,
  getProductSitemapEntries,
  getProductById,
  createProduct,
  updateProduct,
  addProductReview,
  getAdminProductReviews,
  updateProductReviewStatus,
  deleteProduct,
} = require("../controllers/productController");
const {
  protect,
  attachUserIfAuthenticated,
  requireAdminPermission,
} = require("../middleware/authMiddleware");
const { createRateLimiter } = require("../middleware/rateLimitMiddleware");
const { requireCsrf } = require("../middleware/csrfMiddleware");

const router = express.Router();

router.get("/", attachUserIfAuthenticated, getProducts);
router.get("/sitemap", getProductSitemapEntries);
router.get(
  "/admin/reviews",
  protect,
  requireAdminPermission("reviews.manage"),
  getAdminProductReviews
);
router.put(
  "/:id/reviews/:reviewId",
  protect,
  requireAdminPermission("reviews.manage"),
  updateProductReviewStatus
);
router.get("/:id", attachUserIfAuthenticated, getProductById);
router.post(
  "/:id/reviews",
  createRateLimiter({ name: "product-reviews", max: 8, windowMs: 60 * 60 * 1000 }),
  protect,
  requireCsrf,
  addProductReview
);
router.post("/", protect, requireCsrf, requireAdminPermission("products.edit"), createProduct);
router.put("/:id", protect, requireCsrf, requireAdminPermission("products.edit"), updateProduct);
router.delete("/:id", protect, requireCsrf, requireAdminPermission("products.edit"), deleteProduct);

module.exports = router;
