const mongoose = require("mongoose");
const env = require("./env");
const { logEvent } = require("../utils/logger");
const { captureError } = require("../utils/errorMonitoring");

const DEPLOYED_INDEX_CONTROL_ENVS = new Set(["staging", "production"]);

function getNormalizedAppEnv(value = env.APP_ENV || env.NODE_ENV) {
  return String(value || "development").trim().toLowerCase();
}

function shouldDisableAutomaticIndexManagement(appEnv = env.APP_ENV || env.NODE_ENV) {
  return DEPLOYED_INDEX_CONTROL_ENVS.has(getNormalizedAppEnv(appEnv));
}

function buildMongooseConnectOptions() {
  const disableAutomaticIndexManagement = shouldDisableAutomaticIndexManagement();

  return {
    serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 5000),
    // In deployed environments, schema index/collection creation must not race
    // startup. The controlled index scripts are responsible for required indexes.
    autoIndex: !disableAutomaticIndexManagement,
    autoCreate: !disableAutomaticIndexManagement,
  };
}

const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI, buildMongooseConnectOptions());

    logEvent("database.connected", { readyState: mongoose.connection.readyState });
    return mongoose.connection;
  } catch (error) {
    logEvent("database.connection_failed", { message: error.message }, "error");
    captureError(error, { component: "mongo", event: "database.connection_failed" });
    throw error;
  }
};

module.exports = connectDB;
module.exports.__private = {
  buildMongooseConnectOptions,
  getNormalizedAppEnv,
  shouldDisableAutomaticIndexManagement,
};
