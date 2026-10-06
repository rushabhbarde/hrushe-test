const { logEvent } = require("../utils/logger");
const { recordMetric } = require("../utils/metrics");
const { markReconciliationScan } = require("../utils/operationsState");
const { sendOwnerAlert } = require("../utils/ownerAlerts");
const { scanStuckOrders } = require("./reconciliationScanner");
const { isBackupConfigured, runDailyBackupIfDue } = require("./databaseBackup");

const RECONCILIATION_INTERVAL_MS = 10 * 60 * 1000;
const BACKUP_CHECK_INTERVAL_MS = 60 * 60 * 1000;

/** Flag payments that got stuck so they show up for a manual check, and tell the owner about new ones. */
async function runReconciliationScan(deps = {}) {
  const scan = deps.scanStuckOrders || scanStuckOrders;
  const alert = deps.sendOwnerAlert || sendOwnerAlert;
  const result = await scan({ limit: 50, markManualReview: true });
  markReconciliationScan(new Date());
  recordMetric("reconciliation.scan", {
    scanned: result.scanned,
    flagged: result.flagged,
    markedManualReview: result.markedManualReview,
  });

  if (result.markedManualReview > 0) {
    const numbers = result.orders
      .filter((order) => order.reviewRequired)
      .map((order) => `#${order.orderNumber || order.id}`)
      .slice(0, 10);
    await alert({
      key: "payment-review",
      subject: `${result.markedManualReview} order${result.markedManualReview === 1 ? "" : "s"} need a payment check`,
      lines: [
        "A payment did not finish cleanly, so the order was set aside for a manual check.",
        `Orders: ${numbers.join(", ")}`,
        "Open Atelier > Orders, compare each with the Razorpay dashboard, then confirm or cancel it.",
      ],
    });
  }

  return result;
}

async function runBackup(deps = {}) {
  const backup = deps.runDailyBackupIfDue || runDailyBackupIfDue;
  const alert = deps.sendOwnerAlert || sendOwnerAlert;
  try {
    return await backup();
  } catch (error) {
    logEvent("backup.failed", { message: error?.message, code: error?.name || "" }, "error");
    await alert({
      key: "backup-failed",
      subject: "Tonight's database backup failed",
      lines: [
        "The nightly database backup could not be written.",
        `Reason: ${error?.message || "unknown"}`,
        "The shop keeps working; the backup will be retried within the hour.",
      ],
    });
    return { ran: false, reason: "failed" };
  }
}

let started = false;

/** Timers that run inside the web service, so no separate scheduler service is needed. */
function startBackgroundJobs() {
  if (started) return;
  started = true;

  const guarded = (name, job) => () =>
    job().catch((error) => logEvent(`${name}.failed`, { message: error?.message }, "error"));

  const reconciliation = guarded("reconciliation.scan", runReconciliationScan);
  setTimeout(reconciliation, 60 * 1000).unref();
  setInterval(reconciliation, RECONCILIATION_INTERVAL_MS).unref();

  if (isBackupConfigured()) {
    const backup = guarded("backup", runBackup);
    setTimeout(backup, 2 * 60 * 1000).unref();
    setInterval(backup, BACKUP_CHECK_INTERVAL_MS).unref();
  } else {
    logEvent("backup.disabled", { message: "BACKUP_R2_BUCKET is not set; nightly backups are off." }, "warn");
  }

  logEvent("background_jobs.started", { backups: isBackupConfigured() });
}

module.exports = { runBackup, runReconciliationScan, startBackgroundJobs };
