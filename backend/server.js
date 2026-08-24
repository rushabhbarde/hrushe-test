require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./src/config/db");
const env = require("./src/config/env");
env.assertRuntimeEnv();
const authRoutes = require("./src/routes/authRoutes");
const productRoutes = require("./src/routes/productRoutes");
const cartRoutes = require("./src/routes/cartRoutes");
const orderRoutes = require("./src/routes/orderRoutes");
const contentRoutes = require("./src/routes/contentRoutes");
const accountRoutes = require("./src/routes/accountRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const supportRoutes = require("./src/routes/supportRoutes");
const newsletterRoutes = require("./src/routes/newsletterRoutes");
const mediaRoutes = require("./src/routes/mediaRoutes");
const internalRoutes = require("./src/routes/internalRoutes");
const { createCorsOptions } = require("./src/middleware/corsMiddleware");
const { notFound, errorHandler } = require("./src/middleware/errorMiddleware");
const { createRateLimiter } = require("./src/middleware/rateLimitMiddleware");
const { ensureAdminUser } = require("./src/utils/ensureAdminUser");
const { logEvent, requestContextMiddleware } = require("./src/utils/logger");
const { recordMetric } = require("./src/utils/metrics");
const { installProcessErrorHandlers } = require("./src/utils/errorMonitoring");
const {
  cleanupExpiredInventoryReservations,
} = require("./src/services/checkoutInventory");
const {
  getCheckoutAttemptIndexReadiness,
  refreshCheckoutAttemptIndexReadiness,
} = require("./src/services/checkoutAttemptIndex");

const app = express();
installProcessErrorHandlers();
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(requestContextMiddleware);
const shouldCaptureRawBody = (req) =>
  req.originalUrl?.startsWith("/order/checkout/webhook/razorpay") ||
  req.originalUrl?.startsWith("/internal/reconciliation/scan") ||
  req.originalUrl?.startsWith("/internal/inventory/cleanup");

app.use(cors(createCorsOptions(env)));
app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  res.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (env.NODE_ENV === "production") {
    res.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  res.set(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
  );
  next();
});

const sendHealthResponse = (req, res) => {
  res.json({ status: "ok" });
};

const sendReadinessResponse = (req, res) => {
  const mongoReady = mongoose.connection.readyState === 1;
  const checkoutReadiness = getCheckoutAttemptIndexReadiness();
  const checkoutReady = checkoutReadiness.ready;
  const ready = mongoReady && checkoutReady;

  res.status(ready ? 200 : 503).json({
    status: ready ? "ready" : "not-ready",
    mongo: mongoReady ? "connected" : "not-connected",
    checkout: checkoutReady ? "available" : "unavailable",
  });
};

app.get("/health", sendHealthResponse);
app.get("/healthz", sendHealthResponse);
app.get("/ready", sendReadinessResponse);
app.get("/readyz", sendReadinessResponse);

app.use(createRateLimiter({ name: "api", max: 600, windowMs: 15 * 60 * 1000 }));
app.use(
  express.json({
    limit: "5mb",
    verify(req, res, buffer) {
      if (shouldCaptureRawBody(req)) {
        req.rawBody = Buffer.from(buffer);
      }
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

app.get("/", (req, res) => {
  res.json({
    message: "Fashion brand API running",
    status: "ok",
  });
});

app.use(
  "/auth",
  createRateLimiter({ name: "auth", max: 80, windowMs: 15 * 60 * 1000 }),
  authRoutes
);
app.use("/products", productRoutes);
app.use("/cart", cartRoutes);
app.use("/order", orderRoutes);
app.use("/content", contentRoutes);
app.use("/account", accountRoutes);
app.use("/admin", adminRoutes);
app.use("/support", supportRoutes);
app.use("/newsletter", newsletterRoutes);
app.use("/media", mediaRoutes);
app.use(
  "/internal",
  createRateLimiter({ name: "internal", max: 12, windowMs: 15 * 60 * 1000 }),
  internalRoutes
);

app.use(notFound);
app.use(errorHandler);

let cleanupInterval = null;

async function startDatabaseBackedTasks() {
  await connectDB();
  await refreshCheckoutAttemptIndexReadiness();
  await ensureAdminUser();
  const cleanupInventory = () =>
    cleanupExpiredInventoryReservations({ source: "interval" })
      .then((result) => {
        recordMetric("inventory.reservations.cleanup", {
          releasedOrders: result.reservationsReleased,
          inspectedOrders: result.ordersInspected,
          lockContended: result.lockContended,
        });
      })
      .catch((error) => {
      logEvent(
        "inventory.cleanup.failed",
        {
          message: error?.message,
          code: error?.code || "",
        },
        "error"
      );
    });
  const cleanedUp = await cleanupExpiredInventoryReservations({ source: "startup" });
  recordMetric("inventory.reservations.cleanup", {
    releasedOrders: cleanedUp.reservationsReleased,
    inspectedOrders: cleanedUp.ordersInspected,
    lockContended: cleanedUp.lockContended,
  });
  if (!cleanupInterval) {
    cleanupInterval = setInterval(cleanupInventory, 5 * 60 * 1000);
    cleanupInterval.unref();
  }
}

app.listen(env.PORT, () => {
  logEvent("server.started", { port: env.PORT });
});

startDatabaseBackedTasks().catch((error) => {
  logEvent(
    "startup.database_tasks.failed",
    {
      message: error?.message,
    },
    "error"
  );
});
