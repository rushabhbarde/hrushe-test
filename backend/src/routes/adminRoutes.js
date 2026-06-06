const express = require("express");
const {
  protect,
  adminOnly,
  requireAdminPermission,
} = require("../middleware/authMiddleware");
const {
  listCustomers,
  getCustomerById,
  listStaffUsers,
  createStaffUser,
  updateStaffUserRole,
} = require("../controllers/adminController");

const router = express.Router();

router.use(protect, adminOnly);

router.get("/customers", requireAdminPermission("customers.view"), listCustomers);
router.get("/customers/:id", requireAdminPermission("customers.view"), getCustomerById);
router.get("/staff", requireAdminPermission("roles.manage"), listStaffUsers);
router.post("/staff", requireAdminPermission("roles.manage"), createStaffUser);
router.put("/staff/:id/role", requireAdminPermission("roles.manage"), updateStaffUserRole);

module.exports = router;
