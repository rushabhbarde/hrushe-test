const express = require("express");
const {
  runInternalReconciliationScan,
} = require("../controllers/internalController");

const router = express.Router();

router.post("/reconciliation/scan", runInternalReconciliationScan);

module.exports = router;
