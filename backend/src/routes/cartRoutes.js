const express = require("express");
const {
  addToCart,
  getCart,
  removeFromCart,
  updateCartItem,
  syncCart,
} = require("../controllers/cartController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/add", protect, addToCart);
router.post("/sync", protect, syncCart);
router.get("/", protect, getCart);
router.put("/item", protect, updateCartItem);
router.delete("/remove", protect, removeFromCart);

module.exports = router;
