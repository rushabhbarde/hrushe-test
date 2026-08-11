#!/usr/bin/env node

require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const Product = require("../src/models/Product");
const {
  reserveInventory,
  releaseInventoryItems,
} = require("../src/services/checkoutInventory");

const enabled = process.env.CONCURRENCY_TEST === "true";
const requests = Math.min(Math.max(Number(process.env.CONCURRENCY_TEST_REQUESTS) || 20, 2), 100);
const stock = Math.min(Math.max(Number(process.env.CONCURRENCY_TEST_STOCK) || 1, 1), 50);

function hasIsolatedName(value) {
  return /(?:^|[-_.:/@])(?:staging|stage|test|qa|sandbox|prelaunch)(?:$|[-_.:/@])/i.test(value);
}

function getMongoDatabaseName(uriValue) {
  try {
    const url = new URL(uriValue);
    const dbName = url.searchParams.get("dbName");
    return decodeURIComponent((dbName || url.pathname.replace(/^\/+/, "")).split("?")[0] || "");
  } catch {
    return "";
  }
}

function assertSafeConfig() {
  if (!enabled) {
    throw new Error("Refusing to run. Set CONCURRENCY_TEST=true for isolated staging/test execution.");
  }

  const dbName = getMongoDatabaseName(process.env.MONGODB_URI || "");
  if (!hasIsolatedName(dbName)) {
    throw new Error("MONGODB_URI must point to an isolated staging/test database.");
  }
}

async function createTestProduct() {
  const suffix = Date.now().toString(36);
  return Product.create({
    name: `Concurrency Test ${suffix}`,
    slug: `concurrency-test-${suffix}`,
    description: "Temporary final-item concurrency test product.",
    price: 999,
    pricePaise: 99900,
    category: "QA",
    categories: ["QA"],
    sizes: ["M"],
    colors: ["Black"],
    images: ["https://example.com/concurrency-test.jpg"],
    status: "Active",
    trackInventory: true,
    variants: [
      {
        sku: `CONCURRENCY-${suffix}`.toUpperCase(),
        size: "M",
        color: "Black",
        fit: "Regular",
        stock,
        reserved: 0,
        active: true,
      },
    ],
    fabric: "Cotton",
    gsm: "220",
    washCare: "Machine wash cold.",
    returnEligible: true,
  });
}

async function main() {
  assertSafeConfig();
  await connectDB();
  const product = await createTestProduct();
  const item = {
    productId: product._id,
    quantity: 1,
    sku: product.variants[0].sku,
    name: product.name,
    inventoryTracked: true,
  };

  const outcomes = await Promise.allSettled(
    Array.from({ length: requests }, () => reserveInventory([item]))
  );
  const successfulReservations = outcomes.filter((outcome) => outcome.status === "fulfilled").length;
  const rejectedReservations = outcomes.length - successfulReservations;
  const afterReserve = await Product.findById(product._id).lean();
  const finalVariant = afterReserve.variants[0];
  const consistent =
    successfulReservations === Math.min(stock, requests) &&
    rejectedReservations === requests - successfulReservations &&
    finalVariant.stock === stock - successfulReservations &&
    finalVariant.reserved === successfulReservations &&
    finalVariant.stock >= 0 &&
    finalVariant.reserved >= 0;

  await Promise.all(
    Array.from({ length: successfulReservations }, () => releaseInventoryItems([item]))
  );
  const afterRelease = await Product.findById(product._id).lean();
  await Product.deleteOne({ _id: product._id });
  await mongoose.disconnect();

  const releaseVariant = afterRelease.variants[0];
  console.log(
    JSON.stringify(
      {
        environment: "isolated-staging-test",
        stock,
        requests,
        successfulReservations,
        rejectedReservations,
        finalStock: finalVariant.stock,
        finalReserved: finalVariant.reserved,
        afterCleanupStock: releaseVariant.stock,
        afterCleanupReserved: releaseVariant.reserved,
        consistent,
      },
      null,
      2
    )
  );

  if (!consistent || releaseVariant.stock !== stock || releaseVariant.reserved !== 0) {
    process.exitCode = 1;
  }
}

if (require.main === module && process.env.npm_lifecycle_event !== "test") {
  main().catch(async (error) => {
    await mongoose.disconnect().catch(() => undefined);
    console.error(JSON.stringify({ ok: false, error: error?.message || "Concurrency test failed." }));
    process.exitCode = 1;
  });
}

module.exports = {
  assertSafeConfig,
  getMongoDatabaseName,
  hasIsolatedName,
};
