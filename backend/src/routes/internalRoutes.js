const express = require("express");
const {
  runInternalInventoryCleanup,
  runInternalReconciliationScan,
} = require("../controllers/internalController");

const router = express.Router();

router.post("/reconciliation/scan", runInternalReconciliationScan);
router.post("/inventory/cleanup", runInternalInventoryCleanup);

module.exports = router;
