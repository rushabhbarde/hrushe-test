const express = require("express");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { listCustomers, getCustomerById } = require("../controllers/adminController");

const router = express.Router();

router.use(protect, adminOnly);

router.get("/customers", listCustomers);
router.get("/customers/:id", getCustomerById);

module.exports = router;
