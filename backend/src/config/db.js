const mongoose = require("mongoose");
const env = require("./env");
const { logEvent } = require("../utils/logger");

const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 5000),
    });

    logEvent("database.connected", { readyState: mongoose.connection.readyState });
    return mongoose.connection;
  } catch (error) {
    logEvent("database.connection_failed", { message: error.message }, "error");
    throw error;
  }
};

module.exports = connectDB;
