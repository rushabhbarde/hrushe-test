const express = require("express");
const {
  protect,
  adminOnly,
  requireAdminPermission,
} = require("../middleware/authMiddleware");
const { requireCsrf } = require("../middleware/csrfMiddleware");
const {
  getDashboardOverview,
  listCustomers,
  getCustomerById,
  listStaffUsers,
  createStaffUser,
  updateStaffUserRole,
  getOperationsSummary,
} = require("../controllers/adminController");

const router = express.Router();

router.use(protect, adminOnly);

router.get("/dashboard/overview", requireAdminPermission("dashboard.view"), getDashboardOverview);
router.get("/operations/summary", requireAdminPermission("operations.view"), getOperationsSummary);
router.get("/customers", requireAdminPermission("customers.view"), listCustomers);
router.get("/customers/:id", requireAdminPermission("customers.view"), getCustomerById);
router.get("/staff", requireAdminPermission("roles.manage"), listStaffUsers);
router.post("/staff", requireCsrf, requireAdminPermission("roles.manage"), createStaffUser);
router.put("/staff/:id/role", requireCsrf, requireAdminPermission("roles.manage"), updateStaffUserRole);

module.exports = router;
