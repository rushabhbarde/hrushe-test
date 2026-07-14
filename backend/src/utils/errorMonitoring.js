const { logEvent, redactValue } = require("./logger");
const { markCriticalError } = require("./operationsState");

let handlersInstalled = false;

function captureError(error, context = {}) {
  const provider = process.env.ERROR_MONITORING_PROVIDER || "structured-log";
  const dsnConfigured = Boolean(String(process.env.ERROR_MONITORING_DSN || "").trim());
  const statusCode = error?.statusCode || 500;
  const appEnv = process.env.APP_ENV || process.env.NODE_ENV || "development";
  const release = process.env.APP_RELEASE || process.env.RENDER_GIT_COMMIT || "";

  if (statusCode >= 500) {
    markCriticalError(new Date());
  }

  logEvent(
    "error.captured",
    {
      provider,
      dsnConfigured,
      appEnv,
      release,
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

function installProcessErrorHandlers() {
  if (handlersInstalled) {
    return;
  }

  process.on("uncaughtException", (error) => {
    captureError(error, { source: "process", kind: "uncaughtException" });
    process.exitCode = 1;
  });

  process.on("unhandledRejection", (reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason || "Unhandled rejection"));
    captureError(error, { source: "process", kind: "unhandledRejection" });
  });

  handlersInstalled = true;
}

module.exports = {
  captureError,
  installProcessErrorHandlers,
};
