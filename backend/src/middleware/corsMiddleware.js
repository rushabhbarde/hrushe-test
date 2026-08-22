const AppError = require("../utils/AppError");

function isAllowedDevOrigin(env, origin) {
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
}

function createCorsOptions(env) {
  return {
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (env.ALLOWED_ORIGINS.includes(origin) || isAllowedDevOrigin(env, origin)) {
        return callback(null, true);
      }

      if (env.NODE_ENV !== "production") {
        return callback(null, true);
      }

      return callback(new AppError("CORS origin not allowed", 403));
    },
    credentials: true,
  };
}

module.exports = {
  createCorsOptions,
  isAllowedDevOrigin,
};
