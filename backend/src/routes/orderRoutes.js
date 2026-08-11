const express = require("express");
const {
  getMyOrders,
  getOrderById,
  downloadInvoice,
  trackOrder,
  getAllOrders,
  updateOrderStatus,
  createCheckout,
  getCheckoutPaymentConfig,
  verifyCheckout,
  failCheckout,
  cancelCheckout,
  razorpayWebhook,
  getPaymentReconciliation,
  reconcileOrderPayment,
  bulkReconcileOrders,
  scanPaymentReconciliation,
  reorderOrder,
} = require("../controllers/orderController");
const {
  protect,
  attachUserIfAuthenticated,
  requireAdminPermission,
} = require("../middleware/authMiddleware");
const { createRateLimiter } = require("../middleware/rateLimitMiddleware");
const { requireCsrf, requireCsrfIfAuthenticated } = require("../middleware/csrfMiddleware");

const router = express.Router();

router.get("/checkout/razorpay-mode", getCheckoutPaymentConfig);
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
router.get("/myorders", protect, getMyOrders);
router.get("/reconciliation", protect, requireAdminPermission("orders.manage"), getPaymentReconciliation);
router.post("/reconciliation/bulk", protect, requireCsrf, requireAdminPermission("orders.manage"), bulkReconcileOrders);
router.post("/reconciliation/scan", protect, requireCsrf, requireAdminPermission("orders.manage"), scanPaymentReconciliation);
router.post("/:id/reconcile", protect, requireCsrf, requireAdminPermission("orders.manage"), reconcileOrderPayment);
router.post("/:id/reorder", protect, requireCsrf, reorderOrder);
router.get("/:id/invoice", protect, downloadInvoice);
router.get("/all", protect, requireAdminPermission("orders.view"), getAllOrders);
router.put("/status/:id", protect, requireCsrf, requireAdminPermission("orders.manage"), updateOrderStatus);
router.get("/:id", protect, getOrderById);

module.exports = router;
