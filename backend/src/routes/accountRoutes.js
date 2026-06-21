const express = require("express");
const {
  getAccountSummary,
  getProfile,
  updateProfile,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getPreferences,
  updatePreferences,
  getCommunicationPreferences,
  updateCommunicationPreferences,
  getWishlist,
  addWishlistItem,
  removeWishlistItem,
  moveWishlistItemToCart,
  createSupportRequest,
} = require("../controllers/accountController");
const { protect } = require("../middleware/authMiddleware");
const { requireCsrf } = require("../middleware/csrfMiddleware");

const router = express.Router();

router.use(protect);

router.get("/summary", getAccountSummary);
router.get("/profile", getProfile);
router.put("/profile", requireCsrf, updateProfile);

router.get("/addresses", getAddresses);
router.post("/addresses", requireCsrf, createAddress);
router.put("/addresses/:addressId", requireCsrf, updateAddress);
router.delete("/addresses/:addressId", requireCsrf, deleteAddress);
router.put("/addresses/:addressId/default", requireCsrf, setDefaultAddress);

router.get("/preferences", getPreferences);
router.put("/preferences", requireCsrf, updatePreferences);

router.get("/notifications", getCommunicationPreferences);
router.put("/notifications", requireCsrf, updateCommunicationPreferences);

router.get("/wishlist", getWishlist);
router.post("/wishlist/:productId", requireCsrf, addWishlistItem);
router.delete("/wishlist/:productId", requireCsrf, removeWishlistItem);
router.post("/wishlist/:productId/move-to-cart", requireCsrf, moveWishlistItemToCart);

router.post("/support", requireCsrf, createSupportRequest);

module.exports = router;
