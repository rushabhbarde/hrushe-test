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
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/checkout/verify", protect, verifyCheckout);
router.get("/checkout/failure", failCheckout);
router.get("/checkout/cancel", cancelCheckout);
router.post("/checkout/webhook/razorpay", razorpayWebhook);
router.post("/checkout", protect, createCheckout);
router.post("/track", trackOrder);
router.post("/place", protect, placeOrder);
router.get("/myorders", protect, getMyOrders);
router.post("/:id/reorder", protect, reorderOrder);
router.get("/:id/invoice", protect, downloadInvoice);
router.get("/all", protect, adminOnly, getAllOrders);
router.put("/status/:id", protect, adminOnly, updateOrderStatus);
router.get("/:id", protect, getOrderById);

module.exports = router;
