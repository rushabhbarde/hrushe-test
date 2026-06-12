const express = require("express");
const {
  getProducts,
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

const router = express.Router();

router.get("/", attachUserIfAuthenticated, getProducts);
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
  attachUserIfAuthenticated,
  addProductReview
);
router.post("/", protect, requireAdminPermission("products.edit"), createProduct);
router.put("/:id", protect, requireAdminPermission("products.edit"), updateProduct);
router.delete("/:id", protect, requireAdminPermission("products.edit"), deleteProduct);

module.exports = router;
