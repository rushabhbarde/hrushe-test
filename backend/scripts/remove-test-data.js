/**
 * Pre-launch clean-up: remove the test customers and test orders so the shop starts empty.
 *
 *   MONGODB_URI="<database address>" node scripts/remove-test-data.js            (shows what would go)
 *   MONGODB_URI="<database address>" node scripts/remove-test-data.js --delete   (removes it)
 *
 * Removes: every order, every customer account (admin accounts are kept), and what hangs off
 * them: bags, one-time codes, help requests, checkout attempts, payment webhook records,
 * back-in-stock requests, personal coupons, newsletter sign-ups and product reviews.
 * Keeps: products, homepage and settings, admin accounts, the audit log.
 * Also releases stock held by unfinished test checkouts and restarts order numbers.
 *
 * This cannot be undone. Take a backup first (the nightly backup counts) and only run it
 * before real customers exist. Add --keep-order-numbers to continue numbering instead.
 */
require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");
const readline = require("readline");

const CONFIRM_PHRASE = "delete test data";

async function plan(db) {
  const count = (name, filter = {}) => db.collection(name).countDocuments(filter);
  const reviews = await db
    .collection("products")
    .aggregate([{ $project: { n: { $size: { $ifNull: ["$reviews", []] } } } }, { $group: { _id: null, n: { $sum: "$n" } } }])
    .toArray();

  return {
    orders: await count("orders"),
    paidOrders: await count("orders", { paymentStatus: "paid" }),
    customers: await count("users", { role: { $ne: "admin" } }),
    adminsKept: await count("users", { role: "admin" }),
    bags: await count("carts"),
    oneTimeCodes: await count("verificationcodes"),
    helpRequests: await count("supportrequests"),
    checkoutAttempts: await count("checkoutattempts"),
    webhookRecords: await count("webhookevents"),
    stockAlerts: await count("stockalerts"),
    coupons: await count("coupons"),
    newsletterSignups: await count("newslettersubscribers"),
    productReviews: reviews[0]?.n || 0,
    productsKept: await count("products"),
  };
}

async function remove(db, { keepOrderNumbers }) {
  const admins = await db.collection("users").find({ role: "admin" }).project({ _id: 1 }).toArray();
  const adminIds = admins.map((admin) => admin._id);

  const removed = {};
  const wipe = async (name, filter = {}) => {
    removed[name] = (await db.collection(name).deleteMany(filter)).deletedCount;
  };

  await wipe("orders");
  await wipe("users", { role: { $ne: "admin" } });
  await wipe("carts", { userId: { $nin: adminIds } });
  await wipe("verificationcodes");
  await wipe("supportrequests");
  await wipe("checkoutattempts");
  await wipe("webhookevents");
  await wipe("stockalerts");
  await wipe("coupons");
  await wipe("newslettersubscribers");

  // Stock held by unfinished test checkouts goes back on the shelf; reviews are cleared.
  const products = await db.collection("products").find({}).toArray();
  for (const product of products) {
    const variants = (product.variants || []).map((variant) => ({
      ...variant,
      stock: Number(variant.stock || 0) + Number(variant.reserved || 0),
      reserved: 0,
    }));
    await db.collection("products").updateOne({ _id: product._id }, { $set: { variants, reviews: [] } });
  }
  removed.productsReset = products.length;

  if (!keepOrderNumbers) {
    removed.orderNumberCounters = (await db.collection("counters").deleteMany({ key: /order/i })).deletedCount;
  }
  return removed;
}

const ask = (question) =>
  new Promise((resolve) => {
    const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
    prompt.question(question, (answer) => {
      prompt.close();
      resolve(answer);
    });
  });

async function main() {
  const args = new Set(process.argv.slice(2));
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Set MONGODB_URI to the database address first.");
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  try {
    const host = (() => {
      try {
        return new URL(uri).hostname;
      } catch {
        return "unknown host";
      }
    })();
    console.log(`Database: ${db.databaseName} on ${host}\n`);
    console.log("What is there now:");
    console.table(await plan(db));

    if (!args.has("--delete")) {
      console.log("Nothing was changed. Run again with --delete to remove the test data.");
      return;
    }

    const answer = process.env.REMOVE_TEST_DATA_CONFIRM || (await ask(`Type "${CONFIRM_PHRASE}" to remove it for good: `));
    if (String(answer).trim().toLowerCase() !== CONFIRM_PHRASE) {
      console.log("Not confirmed. Nothing was changed.");
      return;
    }

    console.log("\nRemoved:");
    console.table(await remove(db, { keepOrderNumbers: args.has("--keep-order-numbers") }));
    console.log("What is left:");
    console.table(await plan(db));
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = { plan, remove };
