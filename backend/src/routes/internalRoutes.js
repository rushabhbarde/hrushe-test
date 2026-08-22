const express = require("express");
const {
  runInternalInventoryCleanup,
  runInternalMonitoringTestAlert,
  runInternalReconciliationScan,
} = require("../controllers/internalController");

const router = express.Router();

router.post("/reconciliation/scan", runInternalReconciliationScan);
router.post("/inventory/cleanup", runInternalInventoryCleanup);
router.post("/monitoring/test-alert", runInternalMonitoringTestAlert);

module.exports = router;
