require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");
const env = require("./src/config/env");
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
const { notFound, errorHandler } = require("./src/middleware/errorMiddleware");
const { createRateLimiter } = require("./src/middleware/rateLimitMiddleware");
const { ensureAdminUser } = require("./src/utils/ensureAdminUser");
const {
  cleanupExpiredInventoryReservations,
} = require("./src/services/checkoutInventory");

const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");
const shouldCaptureRawBody = (req) =>
  req.originalUrl?.startsWith("/order/checkout/webhook/razorpay");

const isAllowedDevOrigin = (origin) => {
  if (env.NODE_ENV === "production") {
    return false;
  }

  try {
    const { hostname, protocol } = new URL(origin);
    return (
      protocol.startsWith("http") &&
      (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "::1" ||
        hostname === "0.0.0.0" ||
        hostname.endsWith(".local")
      )
    );
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (env.ALLOWED_ORIGINS.includes(origin) || isAllowedDevOrigin(origin)) {
        return callback(null, true);
      }

      if (env.NODE_ENV !== "production") {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
  })
);
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

app.use(notFound);
app.use(errorHandler);

connectDB()
  .then(async () => {
    await ensureAdminUser();
    const cleanupInventory = () =>
      cleanupExpiredInventoryReservations().catch((error) => {
        console.error("Inventory reservation cleanup failed", error);
      });
    await cleanupInventory();
    setInterval(cleanupInventory, 5 * 60 * 1000).unref();
    app.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
    });
  })
  .catch((error) => {
    console.error("Server startup failed", error);
    process.exit(1);
  });
