const express = require("express");
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  addProductReview,
  deleteProduct,
} = require("../controllers/productController");
const { protect, requireAdminPermission } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/:id/reviews", addProductReview);
router.post("/", protect, requireAdminPermission("products.edit"), createProduct);
router.put("/:id", protect, requireAdminPermission("products.edit"), updateProduct);
router.delete("/:id", protect, requireAdminPermission("products.edit"), deleteProduct);

module.exports = router;
