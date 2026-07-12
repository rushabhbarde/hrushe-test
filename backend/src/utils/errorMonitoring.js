const { logEvent, redactValue } = require("./logger");

function captureError(error, context = {}) {
  const provider = process.env.ERROR_MONITORING_PROVIDER || "structured-log";
  const dsnConfigured = Boolean(String(process.env.ERROR_MONITORING_DSN || "").trim());
  const statusCode = error?.statusCode || 500;

  logEvent(
    "error.captured",
    {
      provider,
      dsnConfigured,
      statusCode,
      error: {
        name: error?.name || "Error",
        message: error?.message || "Unknown error",
        code: error?.code || "",
        isOperational: Boolean(error?.isOperational),
        stack:
          process.env.NODE_ENV === "production"
            ? ""
            : String(error?.stack || "").split("\n").slice(0, 8).join("\n"),
      },
      context: redactValue(context),
    },
    "error"
  );

  return {
    captured: true,
    provider,
    dsnConfigured,
  };
}

module.exports = {
  captureError,
};
