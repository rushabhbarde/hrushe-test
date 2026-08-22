#!/usr/bin/env node

require("dotenv").config();

const env = require("../src/config/env");

const checks = [];

function addCheck(label, pass, message = "") {
  checks.push({ label, pass: Boolean(pass), message });
}

function hasValue(key) {
  return Boolean(String(process.env[key] || "").trim());
}

function hasPlaceholderValue(value) {
  return /(?:your-|choose-a-random|changeme|change-me|placeholder|example|development-secret|test-secret|redacted)/i.test(
    String(value || "")
  );
}

function isHttpsUrl(value) {
  try {
    return new URL(String(value || "")).protocol === "https:";
  } catch {
    return false;
  }
}

function hasOnlySafeOrigins(origins = []) {
  return origins.length > 0 && origins.every((origin) => {
    if (origin === "*") {
      return false;
    }
    try {
      const url = new URL(origin);
      return url.protocol === "https:" && !["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname);
    } catch {
      return false;
    }
  });
}

const requiredKeys = [
  "APP_ENV",
  "CLIENT_URL",
  "BACKEND_PUBLIC_URL",
  "ALLOWED_ORIGINS",
  "MONGODB_URI",
  "JWT_SECRET",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "INTERNAL_SCHEDULER_SECRET",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
];

const placeholderKeys = requiredKeys.filter((key) => hasPlaceholderValue(process.env[key]));

addCheck("APP_ENV is production", String(env.APP_ENV || "").toLowerCase() === "production");
addCheck("Required production variables", requiredKeys.every(hasValue), "Missing: " + requiredKeys.filter((key) => !hasValue(key)).join(", "));
addCheck("No placeholder secret values", placeholderKeys.length === 0, "Placeholder keys: " + placeholderKeys.join(", "));
addCheck("MongoDB configuration", hasValue("MONGODB_URI") && !hasPlaceholderValue(process.env.MONGODB_URI));
addCheck("JWT secret strength", hasValue("JWT_SECRET") && env.JWT_SECRET.length >= 32 && !hasPlaceholderValue(env.JWT_SECRET));
addCheck("Secure cookie mode", env.COOKIE_SECURE === true && ["lax", "strict"].includes(env.COOKIE_SAME_SITE));
addCheck("Allowed origins", hasOnlySafeOrigins(env.ALLOWED_ORIGINS));
addCheck("Customer/backend/media URLs use HTTPS", isHttpsUrl(env.CLIENT_URL) && isHttpsUrl(env.BACKEND_PUBLIC_URL) && isHttpsUrl(env.R2_PUBLIC_URL));
addCheck("Razorpay live config", env.RAZORPAY_KEY_ID.startsWith("rzp_live_") && hasValue("RAZORPAY_KEY_SECRET"));
addCheck("Webhook secret", hasValue("RAZORPAY_WEBHOOK_SECRET") && env.RAZORPAY_WEBHOOK_SECRET.length >= 32);
addCheck("OTP dev mode disabled", env.OTP_DEV_MODE === false);
addCheck("COD disabled", env.ENABLE_COD === false);
addCheck("R2 config", ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME", "R2_PUBLIC_URL"].every(hasValue));
addCheck("Email config", Boolean(env.ZEPTOMAIL_API_KEY || (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS)));
addCheck("Scheduler secret", hasValue("INTERNAL_SCHEDULER_SECRET") && env.INTERNAL_SCHEDULER_SECRET.length >= 32);

let assertionError = null;
try {
  env.assertProductionEnv();
} catch (error) {
  assertionError = error;
}
addCheck("Startup production guard", !assertionError, assertionError?.message || "");

const labelWidth = Math.max(...checks.map((check) => check.label.length), 1);
for (const check of checks) {
  const status = check.pass ? "PASS" : "FAIL";
  const suffix = check.pass || !check.message ? "" : ` (${check.message})`;
  console.log(`${check.label.padEnd(labelWidth, ".")} ${status}${suffix}`);
}

if (checks.some((check) => !check.pass)) {
  process.exitCode = 1;
}
