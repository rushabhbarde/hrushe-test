const mongoose = require("mongoose");

const AppError = require("../utils/AppError");
const { captureError } = require("../utils/errorMonitoring");
const { getRequestId, logEvent } = require("../utils/logger");

const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};

const errorHandler = (error, req, res, next) => {
  let normalizedError = error;

  if (
    normalizedError.name === "CastError" &&
    normalizedError instanceof mongoose.Error
  ) {
    normalizedError = new AppError("Invalid resource id", 400);
  } else if (normalizedError.name === "ValidationError") {
    normalizedError = new AppError(normalizedError.message, 400);
  } else if (normalizedError.code === 11000) {
    const duplicateFields = Object.keys(normalizedError.keyPattern || normalizedError.keyValue || {});
    const duplicateField = duplicateFields[0] || "";
    const message =
      duplicateField === "phone"
        ? "Phone number is already in use"
        : duplicateField === "email"
          ? "Email is already in use"
          : "A record with this value already exists";
    normalizedError = new AppError(message, 409);
  } else if (!normalizedError.isOperational) {
    normalizedError = new AppError(
      normalizedError.message || "Internal server error",
      normalizedError.statusCode || 500
    );
  }

  const statusCode = normalizedError.statusCode || 500;

  if (statusCode >= 500) {
    captureError(normalizedError, {
      requestId: getRequestId(req),
      method: req.method,
      path: req.originalUrl || req.url,
      userId: req.user?._id?.toString?.() || "",
    });
  } else {
    logEvent(
      "http.request.error",
      {
        statusCode,
        method: req.method,
        path: req.originalUrl || req.url,
        message: normalizedError.message,
      },
      "warn"
    );
  }

  const publicMessage =
    statusCode >= 500 && process.env.NODE_ENV === "production"
      ? "Internal server error"
      : normalizedError.message || "Internal server error";

  res.status(statusCode).json({
    message: publicMessage,
    status: normalizedError.status || "error",
    requestId: getRequestId(req),
  });
};

module.exports = { notFound, errorHandler };
