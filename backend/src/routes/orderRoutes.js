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
const { requireCsrf, requireCsrfIfAuthenticated } = require("../middleware/csrfMiddleware");
const env = require("../config/env");

const router = express.Router();

router.post("/checkout/verify", attachUserIfAuthenticated, requireCsrfIfAuthenticated, verifyCheckout);
router.post("/checkout/failure", attachUserIfAuthenticated, requireCsrfIfAuthenticated, failCheckout);
router.get("/checkout/failure", failCheckout);
router.get("/checkout/cancel", cancelCheckout);
router.post("/checkout/webhook/razorpay", razorpayWebhook);
router.post(
  "/checkout",
  createRateLimiter({ name: "checkout", max: 20, windowMs: 15 * 60 * 1000 }),
  attachUserIfAuthenticated,
  requireCsrfIfAuthenticated,
  createCheckout
);
router.post(
  "/track",
  createRateLimiter({ name: "order-track", max: 20, windowMs: 15 * 60 * 1000 }),
  trackOrder
);
if (env.ENABLE_COD) {
  router.post("/place", protect, requireCsrf, placeOrder);
}
router.get("/myorders", protect, getMyOrders);
router.post("/:id/reorder", protect, requireCsrf, reorderOrder);
router.get("/:id/invoice", protect, downloadInvoice);
router.get("/all", protect, requireAdminPermission("orders.view"), getAllOrders);
router.put("/status/:id", protect, requireCsrf, requireAdminPermission("orders.manage"), updateOrderStatus);
router.get("/:id", protect, getOrderById);

module.exports = router;
