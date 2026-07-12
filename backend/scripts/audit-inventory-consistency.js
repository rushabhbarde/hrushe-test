require("dotenv").config();

const mongoose = require("mongoose");
const env = require("../src/config/env");
const Order = require("../src/models/Order");
const Product = require("../src/models/Product");
const { releaseOrderInventory } = require("../src/services/checkoutInventory");

const shouldRepairSafe = process.argv.includes("--repair-safe");
const backupConfirmed =
  process.argv.includes("--backup-created") ||
  process.env.INVENTORY_REPAIR_BACKUP_CONFIRMED === "true";

function analyzeProducts(products = []) {
  const findings = {
    duplicateSkuProducts: [],
    negativeStockVariants: [],
    negativeReservedVariants: [],
    archivedProductsWithReservedStock: [],
  };

  products.forEach((product) => {
    const variants = product.variants || [];
    const skus = variants.map((variant) => String(variant.sku || "").trim()).filter(Boolean);
    if (new Set(skus).size !== skus.length) {
      findings.duplicateSkuProducts.push({
        productId: product._id.toString(),
        name: product.name,
      });
    }

    variants.forEach((variant) => {
      const variantRef = {
        productId: product._id.toString(),
        name: product.name,
        sku: variant.sku || "",
      };
      if (Number(variant.stock || 0) < 0) {
        findings.negativeStockVariants.push({
          ...variantRef,
          stock: Number(variant.stock || 0),
        });
      }
      if (Number(variant.reserved || 0) < 0) {
        findings.negativeReservedVariants.push({
          ...variantRef,
          reserved: Number(variant.reserved || 0),
        });
      }
    });

    const reservedTotal = variants.reduce(
      (sum, variant) => sum + Number(variant.reserved || 0),
      0
    );
    if (String(product.status || "").toLowerCase() === "archived" && reservedTotal > 0) {
      findings.archivedProductsWithReservedStock.push({
        productId: product._id.toString(),
        name: product.name,
        reservedTotal,
      });
    }
  });

  return findings;
}

function analyzeOrders(orders = [], now = Date.now()) {
  const findings = {
    paidOrdersWithReservedInventory: [],
    failedOrCancelledOrdersWithReservedInventory: [],
    expiredReservations: [],
    trackedOrdersMissingReservation: [],
  };

  orders.forEach((order) => {
    const hasTrackedItems = (order.products || []).some((item) => item.inventoryTracked);
    const orderRef = {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber || null,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      inventoryReservationStatus: order.inventoryReservationStatus,
      inventoryReservationExpiresAt: order.inventoryReservationExpiresAt || null,
    };

    if (order.paymentStatus === "paid" && order.inventoryReservationStatus === "reserved") {
      findings.paidOrdersWithReservedInventory.push(orderRef);
    }

    if (
      ["failed", "cancelled"].includes(order.paymentStatus) &&
      order.inventoryReservationStatus === "reserved"
    ) {
      findings.failedOrCancelledOrdersWithReservedInventory.push(orderRef);
    }

    if (
      order.inventoryReservationStatus === "reserved" &&
      order.inventoryReservationExpiresAt &&
      new Date(order.inventoryReservationExpiresAt).getTime() < now
    ) {
      findings.expiredReservations.push(orderRef);
    }

    if (
      hasTrackedItems &&
      order.paymentStatus === "initiated" &&
      !["reserved", "committed"].includes(order.inventoryReservationStatus)
    ) {
      findings.trackedOrdersMissingReservation.push(orderRef);
    }
  });

  return findings;
}

async function main() {
  if (shouldRepairSafe && !backupConfirmed) {
    throw new Error(
      "Refusing --repair-safe without --backup-created or INVENTORY_REPAIR_BACKUP_CONFIRMED=true."
    );
  }

  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 5000),
  });

  const [products, orders] = await Promise.all([
    Product.find({ trackInventory: true }).select("_id name status variants").lean(),
    Order.find({}).select(
      "_id orderNumber products paymentStatus orderStatus inventoryReservationStatus inventoryReservationExpiresAt"
    ),
  ]);
  const productFindings = analyzeProducts(products);
  const orderFindings = analyzeOrders(orders);
  let repairedReservations = 0;

  if (shouldRepairSafe) {
    const repairableOrderIds = new Set(
      [
        ...orderFindings.failedOrCancelledOrdersWithReservedInventory,
        ...orderFindings.expiredReservations.filter((order) => order.paymentStatus !== "paid"),
      ].map((order) => order.orderId)
    );

    for (const orderId of repairableOrderIds) {
      const order = orders.find((candidate) => candidate._id.toString() === orderId);
      if (!order || order.paymentStatus === "paid") {
        continue;
      }
      await releaseOrderInventory(order);
      if (order.paymentStatus === "initiated") {
        order.paymentStatus = "cancelled";
      }
      await order.save();
      repairedReservations += 1;
    }
  }

  console.log(
    JSON.stringify(
      {
        mode: shouldRepairSafe ? "repair-safe" : "report",
        productsScanned: products.length,
        ordersScanned: orders.length,
        repairedReservations,
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
      console.error("Inventory audit failed", { message: error?.message });
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.disconnect().catch(() => undefined);
    });
}

module.exports = {
  analyzeOrders,
  analyzeProducts,
};
