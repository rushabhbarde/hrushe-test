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
const { notFound, errorHandler } = require("./src/middleware/errorMiddleware");

const app = express();
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
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.get("/", (req, res) => {
  res.json({
    message: "Fashion brand API running",
    status: "ok",
  });
});

app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/cart", cartRoutes);
app.use("/order", orderRoutes);
app.use("/content", contentRoutes);

app.use(notFound);
app.use(errorHandler);

connectDB().then(() => {
  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
});
