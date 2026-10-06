const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const {
  backupKeyForDate,
  deserializeBackup,
  selectExpiredBackupKeys,
  serializeBackup,
} = require("../src/services/databaseBackup");
const { runBackup, runReconciliationScan } = require("../src/services/backgroundJobs");
const { ALERT_THROTTLE_MS, resetOwnerAlertsForTests, sendOwnerAlert } = require("../src/utils/ownerAlerts");

test("a backup round-trips ObjectIds and dates exactly", () => {
  const id = new mongoose.Types.ObjectId();
  const placedAt = new Date("2026-10-07T04:30:00.000Z");
  const buffer = serializeBackup({ orders: [{ _id: id, placedAt, total: 599 }], products: [] }, placedAt);
  const restored = deserializeBackup(buffer);

  assert.equal(restored.collections.orders[0]._id.toHexString(), id.toHexString());
  assert.equal(restored.collections.orders[0].placedAt.getTime(), placedAt.getTime());
  // Numbers come back as exact BSON types (Int32 here), so a restore keeps int vs double.
  assert.equal(Number(restored.collections.orders[0].total), 599);
  assert.deepEqual(restored.collections.products, []);
});

test("a file that is not a backup is refused", () => {
  const zlib = require("zlib");
  assert.throws(() => deserializeBackup(zlib.gzipSync(Buffer.from("{}"))), /Not a HRUSHE backup/);
});

test("backups are named by day and expire after the retention window", () => {
  const now = new Date("2026-10-07T12:00:00Z");
  assert.equal(backupKeyForDate(now), "backups/hrushe-2026-10-07.json.gz");
  assert.deepEqual(
    selectExpiredBackupKeys(
      ["backups/hrushe-2026-08-30.json.gz", "backups/hrushe-2026-09-07.json.gz", "backups/hrushe-2026-10-06.json.gz", "backups/notes.txt"],
      now
    ),
    ["backups/hrushe-2026-08-30.json.gz"]
  );
});

test("the owner is emailed once per problem, not on every repeat", async () => {
  resetOwnerAlertsForTests();
  const sent = [];
  const options = { enabled: true, recipient: "owner@example.com", send: async (mail) => sent.push(mail) };

  const first = await sendOwnerAlert({ key: "server-error", subject: "The server hit an error", lines: ["a"] }, { ...options, now: 1_000 });
  const repeat = await sendOwnerAlert({ key: "server-error", subject: "again", lines: ["b"] }, { ...options, now: 2_000 });
  const later = await sendOwnerAlert({ key: "server-error", subject: "later", lines: ["c"] }, { ...options, now: 1_000 + ALERT_THROTTLE_MS });
  const off = await sendOwnerAlert({ key: "other", subject: "x" }, { ...options, enabled: false });

  assert.equal(first.sent, true);
  assert.equal(repeat.reason, "throttled");
  assert.equal(later.sent, true);
  assert.equal(off.reason, "disabled");
  assert.equal(sent.length, 2);
  assert.equal(sent[0].to, "owner@example.com");
  assert.match(sent[0].subject, /^\[HRUSHE\] /);
});

test("the stuck-payment check alerts only when it sets new orders aside", async () => {
  const alerts = [];
  const quiet = await runReconciliationScan({
    scanStuckOrders: async () => ({ scanned: 2, flagged: 1, markedManualReview: 0, orders: [] }),
    sendOwnerAlert: async (alert) => alerts.push(alert),
  });
  assert.equal(quiet.scanned, 2);
  assert.equal(alerts.length, 0);

  await runReconciliationScan({
    scanStuckOrders: async () => ({
      scanned: 1,
      flagged: 1,
      markedManualReview: 1,
      orders: [{ id: "abc", orderNumber: "HR-1042", reviewRequired: true }],
    }),
    sendOwnerAlert: async (alert) => alerts.push(alert),
  });
  assert.equal(alerts.length, 1);
  assert.match(alerts[0].lines.join(" "), /#HR-1042/);
});

test("a failed backup alerts the owner instead of crashing the job", async () => {
  const alerts = [];
  const result = await runBackup({
    runDailyBackupIfDue: async () => {
      throw new Error("AccessDenied");
    },
    sendOwnerAlert: async (alert) => alerts.push(alert),
  });
  assert.equal(result.reason, "failed");
  assert.equal(alerts[0].key, "backup-failed");
});

test("the invoice is a Tax Invoice only when the seller has a GSTIN", () => {
  const { buildInvoicePdf } = require("../src/utils/invoicePdf");
  const order = {
    orderNumber: "HR-1042",
    createdAt: new Date("2026-10-07T00:00:00Z"),
    paymentStatus: "paid",
    orderStatus: "Confirmed",
    customerName: "A Customer",
    shippingAddress: "Somewhere",
    totalAmount: 599,
    products: [{ name: "Olive Grove Tee", size: "M", quantity: 1, price: 599 }],
  };
  const seller = { legalName: "HRUSHE (Hrushabh Barde)", address: "1, Barde Farms, Wani" };

  const plain = buildInvoicePdf(order, { ...seller, gstin: "" }).toString("utf8");
  assert.match(plain, /\(Invoice\) Tj/);
  assert.doesNotMatch(plain, /Tax Invoice|GSTIN/);
  assert.match(plain, /Sold by/);

  const registered = buildInvoicePdf(order, { ...seller, gstin: "27ABCDE1234F1Z5" }).toString("utf8");
  assert.match(registered, /\(Tax Invoice\) Tj/);
  assert.match(registered, /GSTIN: 27ABCDE1234F1Z5/);
});
