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

const router = express.Router();

router.use(protect);

router.get("/summary", getAccountSummary);
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

router.get("/addresses", getAddresses);
router.post("/addresses", createAddress);
router.put("/addresses/:addressId", updateAddress);
router.delete("/addresses/:addressId", deleteAddress);
router.put("/addresses/:addressId/default", setDefaultAddress);

router.get("/preferences", getPreferences);
router.put("/preferences", updatePreferences);

router.get("/notifications", getCommunicationPreferences);
router.put("/notifications", updateCommunicationPreferences);

router.get("/wishlist", getWishlist);
router.post("/wishlist/:productId", addWishlistItem);
router.delete("/wishlist/:productId", removeWishlistItem);
router.post("/wishlist/:productId/move-to-cart", moveWishlistItemToCart);

router.post("/support", createSupportRequest);

module.exports = router;
