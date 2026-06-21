const express = require("express");
const {
  addToCart,
  getCart,
  removeFromCart,
  updateCartItem,
  syncCart,
} = require("../controllers/cartController");
const { protect } = require("../middleware/authMiddleware");
const { requireCsrf } = require("../middleware/csrfMiddleware");

const router = express.Router();

router.post("/add", protect, requireCsrf, addToCart);
router.post("/sync", protect, requireCsrf, syncCart);
router.get("/", protect, getCart);
router.put("/item", protect, requireCsrf, updateCartItem);
router.delete("/remove", protect, requireCsrf, removeFromCart);

module.exports = router;
