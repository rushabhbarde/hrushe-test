const AppError = require("./AppError");

function isDuplicateKeyError(error) {
  return error?.code === 11000;
}

function getDuplicateUserField(error) {
  const keyPattern = error?.keyPattern || {};
  const keyValue = error?.keyValue || {};

  if (Object.prototype.hasOwnProperty.call(keyPattern, "phone") || Object.prototype.hasOwnProperty.call(keyValue, "phone")) {
    return "phone";
  }

  if (Object.prototype.hasOwnProperty.call(keyPattern, "email") || Object.prototype.hasOwnProperty.call(keyValue, "email")) {
    return "email";
  }

  const message = String(error?.message || "").toLowerCase();
  if (message.includes("phone")) {
    return "phone";
  }
  if (message.includes("email")) {
    return "email";
  }

  return "";
}

function toUserConflictError(error, fallbackMessage = "User already exists") {
  if (!isDuplicateKeyError(error)) {
    return null;
  }

  const field = getDuplicateUserField(error);
  if (field === "phone") {
    return new AppError("Phone number is already in use", 409);
  }
  if (field === "email") {
    return new AppError(fallbackMessage, 409);
  }

  return new AppError(fallbackMessage, 409);
}

module.exports = {
  getDuplicateUserField,
  isDuplicateKeyError,
  toUserConflictError,
};
