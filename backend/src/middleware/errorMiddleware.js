const mongoose = require("mongoose");

const AppError = require("../utils/AppError");

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
    normalizedError = new AppError("A record with this value already exists", 409);
  } else if (!normalizedError.isOperational) {
    normalizedError = new AppError(
      normalizedError.message || "Internal server error",
      normalizedError.statusCode || 500
    );
  }

  const statusCode = normalizedError.statusCode || 500;

  if (statusCode >= 500) {
    console.error(normalizedError);
  }

  res.status(statusCode).json({
    message: normalizedError.message || "Internal server error",
    status: normalizedError.status || "error",
  });
};

module.exports = { notFound, errorHandler };
