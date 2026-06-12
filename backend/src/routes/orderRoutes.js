const express = require("express");
const {
  placeOrder,
  getMyOrders,
  getOrderById,
  downloadInvoice,
  trackOrder,
  getAllOrders,
  updateOrderStatus,
  createCheckout,
  verifyCheckout,
  failCheckout,
  cancelCheckout,
  razorpayWebhook,
  reorderOrder,
} = require("../controllers/orderController");
const {
  protect,
  attachUserIfAuthenticated,
  requireAdminPermission,
} = require("../middleware/authMiddleware");
const { createRateLimiter } = require("../middleware/rateLimitMiddleware");

const router = express.Router();

router.post("/checkout/verify", attachUserIfAuthenticated, verifyCheckout);
router.post("/checkout/failure", attachUserIfAuthenticated, failCheckout);
router.get("/checkout/failure", failCheckout);
router.get("/checkout/cancel", cancelCheckout);
router.post("/checkout/webhook/razorpay", razorpayWebhook);
router.post("/checkout", attachUserIfAuthenticated, createCheckout);
router.post(
  "/track",
  createRateLimiter({ name: "order-track", max: 20, windowMs: 15 * 60 * 1000 }),
  trackOrder
);
router.post("/place", protect, placeOrder);
router.get("/myorders", protect, getMyOrders);
router.post("/:id/reorder", protect, reorderOrder);
router.get("/:id/invoice", protect, downloadInvoice);
router.get("/all", protect, requireAdminPermission("orders.view"), getAllOrders);
router.put("/status/:id", protect, requireAdminPermission("orders.manage"), updateOrderStatus);
router.get("/:id", protect, getOrderById);

module.exports = router;
