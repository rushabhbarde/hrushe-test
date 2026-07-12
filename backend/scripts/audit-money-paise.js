require("dotenv").config();

const mongoose = require("mongoose");
const env = require("../src/config/env");
const Order = require("../src/models/Order");
const Product = require("../src/models/Product");
const { rupeesToPaise } = require("../src/utils/money");

const shouldApply = process.argv.includes("--apply");
const backupConfirmed =
  process.argv.includes("--backup-created") ||
  process.env.MONEY_MIGRATION_BACKUP_CONFIRMED === "true";

function analyzeProduct(product) {
  const expectedPricePaise = rupeesToPaise(product.price);
  const expectedCompareAtPricePaise =
    product.compareAtPrice === undefined || product.compareAtPrice === null
      ? undefined
      : rupeesToPaise(product.compareAtPrice);
  const issues = [];
  const patch = {};

  if (product.pricePaise === undefined || product.pricePaise === null) {
    issues.push("missing-price-paise");
    patch.pricePaise = expectedPricePaise;
  } else if (Number(product.pricePaise) !== expectedPricePaise) {
    issues.push("price-paise-mismatch");
  }

  if (
    expectedCompareAtPricePaise !== undefined &&
    (product.compareAtPricePaise === undefined ||
      product.compareAtPricePaise === null)
  ) {
    issues.push("missing-compare-at-price-paise");
    patch.compareAtPricePaise = expectedCompareAtPricePaise;
  } else if (
    expectedCompareAtPricePaise !== undefined &&
    Number(product.compareAtPricePaise) !== expectedCompareAtPricePaise
  ) {
    issues.push("compare-at-price-paise-mismatch");
  }

  return {
    id: product._id.toString(),
    issues,
    patch,
    safelyBackfillable: issues.every((issue) => issue.startsWith("missing-")),
  };
}

function analyzeOrder(order) {
  const expectedTotalPaise = rupeesToPaise(order.totalAmount);
  const itemIssues = [];
  const patch = {};

  (order.products || []).forEach((item, index) => {
    const expectedPricePaise = rupeesToPaise(item.price);
    if (item.pricePaise === undefined || item.pricePaise === null) {
      itemIssues.push({ index, issue: "missing-item-price-paise" });
    } else if (Number(item.pricePaise) !== expectedPricePaise) {
      itemIssues.push({ index, issue: "item-price-paise-mismatch" });
    }
  });

  if (order.totalPaise === undefined || order.totalPaise === null) {
    patch.totalPaise = expectedTotalPaise;
  }

  if (order.subtotalPaise === undefined || order.subtotalPaise === null) {
    patch.subtotalPaise = (order.products || []).reduce(
      (sum, item) =>
        sum +
        rupeesToPaise(item.price) * Number(item.quantity || 0),
      0
    );
  }

  const issues = [];
  if (order.totalPaise === undefined || order.totalPaise === null) {
    issues.push("missing-total-paise");
  } else if (Number(order.totalPaise) !== expectedTotalPaise) {
    issues.push("total-paise-mismatch");
  }
  if (order.subtotalPaise === undefined || order.subtotalPaise === null) {
    issues.push("missing-subtotal-paise");
  }
  issues.push(...itemIssues.map((issue) => issue.issue));

  return {
    id: order._id.toString(),
    orderNumber: order.orderNumber || null,
    issues,
    itemIssues,
    patch,
    safelyBackfillable: issues.every((issue) => issue.startsWith("missing-")),
  };
}

async function main() {
  if (shouldApply && !backupConfirmed) {
    throw new Error(
      "Refusing to apply money migration without --backup-created or MONEY_MIGRATION_BACKUP_CONFIRMED=true."
    );
  }

  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 5000),
  });

  const [products, orders] = await Promise.all([
    Product.find({}).select("_id price pricePaise compareAtPrice compareAtPricePaise").lean(),
    Order.find({}).select("_id orderNumber products totalAmount totalPaise subtotalPaise").lean(),
  ]);
  const productFindings = products.map(analyzeProduct).filter((item) => item.issues.length > 0);
  const orderFindings = orders.map(analyzeOrder).filter((item) => item.issues.length > 0);
  const safeProductBackfills = productFindings.filter((item) => item.safelyBackfillable);
  const safeOrderBackfills = orderFindings.filter((item) => item.safelyBackfillable);

  if (shouldApply) {
    for (const finding of safeProductBackfills) {
      await Product.updateOne({ _id: finding.id }, { $set: finding.patch });
    }
    for (const finding of safeOrderBackfills) {
      const order = await Order.findById(finding.id);
      if (!order) {
        continue;
      }
      order.products.forEach((item) => {
        if (item.pricePaise === undefined || item.pricePaise === null) {
          item.pricePaise = rupeesToPaise(item.price);
        }
      });
      Object.assign(order, finding.patch);
      await order.save();
    }
  }

  console.log(
    JSON.stringify(
      {
        mode: shouldApply ? "apply" : "report",
        productsScanned: products.length,
        ordersScanned: orders.length,
        productsWithMoneyIssues: productFindings.length,
        ordersWithMoneyIssues: orderFindings.length,
        safeProductBackfills: safeProductBackfills.length,
        safeOrderBackfills: safeOrderBackfills.length,
        appliedProductBackfills: shouldApply ? safeProductBackfills.length : 0,
        appliedOrderBackfills: shouldApply ? safeOrderBackfills.length : 0,
        mismatchFindingsRequireManualReview:
          productFindings.filter((item) => !item.safelyBackfillable).length +
          orderFindings.filter((item) => !item.safelyBackfillable).length,
        productFindings,
        orderFindings,
      },
      null,
      2
    )
  );
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error("Money audit failed", { message: error?.message });
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.disconnect().catch(() => undefined);
    });
}

module.exports = {
  analyzeOrder,
  analyzeProduct,
};
