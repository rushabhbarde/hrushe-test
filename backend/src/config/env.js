const { logEvent } = require("../utils/logger");

const parseOrigins = (value) =>
  String(value || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const PRODUCTION_SITE_ORIGINS = [
  "https://hrushe.in",
  "https://www.hrushe.in",
];

const uniqueOrigins = (origins) => Array.from(new Set(origins));

const normalizeCookieSameSite = (value) => {
  const normalized = String(value || "lax").trim().toLowerCase();

  // Older deployments used cross-site browser calls and were configured with
  // SameSite=None. The storefront now proxies API requests through its own
  // origin, so migrate that known legacy value to the safer Lax policy.
  if (process.env.NODE_ENV === "production" && normalized === "none") {
    logEvent(
      "config.cookie_same_site.legacy_value",
      {
        message:
          "COOKIE_SAME_SITE=none is legacy configuration; using lax for same-origin API proxy cookies. Update the Render environment value to lax.",
      },
      "warn"
    );
    return "lax";
  }

  return normalized;
};

const buildAllowedOrigins = () =>
  uniqueOrigins([
    ...parseOrigins(process.env.ALLOWED_ORIGINS),
    ...parseOrigins(process.env.CLIENT_URL),
    ...(process.env.NODE_ENV === "production" ? PRODUCTION_SITE_ORIGINS : []),
  ]);

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  APP_ENV: process.env.APP_ENV || process.env.NODE_ENV || "development",
  APP_RELEASE: process.env.APP_RELEASE || process.env.RENDER_GIT_COMMIT || "",
  PORT: Number(process.env.PORT) || 5001,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
  ALLOWED_ORIGINS: buildAllowedOrigins(),
  BACKEND_PUBLIC_URL:
    process.env.BACKEND_PUBLIC_URL ||
    `http://localhost:${Number(process.env.PORT) || 5001}`,
  MONGODB_URI:
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hrushetest",
  JWT_SECRET: process.env.JWT_SECRET || "development-secret",
  ADMIN_EMAIL:
    process.env.ADMIN_EMAIL ||
    (process.env.NODE_ENV === "production" ? "" : "team@hrushe.in"),
  ADMIN_PASSWORD:
    process.env.ADMIN_PASSWORD ||
    (process.env.NODE_ENV === "production" ? "" : "admin"),
  ADMIN_NAME: process.env.ADMIN_NAME || "Admin",
  ADMIN_ROLE: process.env.ADMIN_ROLE || "super-admin",
  COOKIE_SAME_SITE: normalizeCookieSameSite(process.env.COOKIE_SAME_SITE),
  COOKIE_SECURE:
    process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production",
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || "",
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "",
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "",
  RAZORPAY_CURRENCY: process.env.RAZORPAY_CURRENCY || "INR",
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || "",
  INTERNAL_SCHEDULER_SECRET: process.env.INTERNAL_SCHEDULER_SECRET || "",
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID || "",
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || "",
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || "",
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || "",
  R2_PUBLIC_URL: String(process.env.R2_PUBLIC_URL || "").replace(/\/+$/, ""),
  R2_ENDPOINT:
    process.env.R2_ENDPOINT ||
    (process.env.R2_ACCOUNT_ID
      ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : ""),
  ENABLE_COD: process.env.ENABLE_COD === "true",
  OTP_DEV_MODE:
    process.env.OTP_DEV_MODE === undefined
      ? process.env.NODE_ENV !== "production"
      : process.env.OTP_DEV_MODE === "true",
  MSG91_AUTH_KEY: process.env.MSG91_AUTH_KEY || "",
  MSG91_SENDER_ID: process.env.MSG91_SENDER_ID || "",
  MSG91_DLT_TEMPLATE_ID: process.env.MSG91_DLT_TEMPLATE_ID || "",
  MSG91_COUNTRY_CODE: process.env.MSG91_COUNTRY_CODE || "91",
  MSG91_OTP_MESSAGE: process.env.MSG91_OTP_MESSAGE || "",
  MAIL_FROM:
    process.env.MAIL_FROM ||
    process.env.SMTP_FROM ||
    process.env.EMAIL_FROM ||
    process.env.SMTP_USER ||
    "team@hrushe.in",
  MAIL_FROM_NAME: process.env.MAIL_FROM_NAME || process.env.EMAIL_FROM_NAME || "Hrushe",
  ZEPTOMAIL_API_KEY:
    process.env.ZEPTOMAIL_API_KEY ||
    process.env.ZEPTO_MAIL_API_KEY ||
    process.env.ZOHO_ZEPTOMAIL_API_KEY ||
    process.env.ZEPTOMAIL_SEND_MAIL_TOKEN ||
    "",
  ZEPTOMAIL_API_URL:
    process.env.ZEPTOMAIL_API_URL || "https://api.zeptomail.in/v1.1/email",
  ZEPTOMAIL_TEMPLATE_API_URL:
    process.env.ZEPTOMAIL_TEMPLATE_API_URL ||
    "https://api.zeptomail.in/v1.1/email/template",
  ZEPTOMAIL_TEMPLATE_SIGNUP_OTP:
    process.env.ZEPTOMAIL_TEMPLATE_SIGNUP_OTP || "",
  ZEPTOMAIL_TEMPLATE_WELCOME:
    process.env.ZEPTOMAIL_TEMPLATE_WELCOME || "",
  ZEPTOMAIL_TEMPLATE_PASSWORD_RESET_OTP:
    process.env.ZEPTOMAIL_TEMPLATE_PASSWORD_RESET_OTP || "",
  ZEPTOMAIL_TEMPLATE_PASSWORD_CHANGED:
    process.env.ZEPTOMAIL_TEMPLATE_PASSWORD_CHANGED || "",
  MAIL_TIMEOUT_MS: Number(process.env.MAIL_TIMEOUT_MS || process.env.EMAIL_TIMEOUT_MS) || 10000,
  SMTP_HOST: process.env.SMTP_HOST || process.env.MAIL_HOST || "",
  SMTP_PORT: Number(process.env.SMTP_PORT || process.env.MAIL_PORT) || 587,
  SMTP_SECURE:
    process.env.SMTP_SECURE === "true" ||
    process.env.MAIL_SECURE === "true" ||
    Number(process.env.SMTP_PORT || process.env.MAIL_PORT) === 465,
  SMTP_USER:
    process.env.SMTP_USER ||
    process.env.MAIL_USER ||
    process.env.EMAIL_USER ||
    process.env.GMAIL_USER ||
    "",
  SMTP_PASS:
    process.env.SMTP_PASS ||
    process.env.MAIL_PASS ||
    process.env.EMAIL_PASS ||
    process.env.GMAIL_PASS ||
    "",
};

function assertProductionEnv() {
  if (env.NODE_ENV !== "production") {
    return;
  }

  const required = {
    CLIENT_URL: process.env.CLIENT_URL,
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
    INTERNAL_SCHEDULER_SECRET: process.env.INTERNAL_SCHEDULER_SECRET,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
  };
  const missing = Object.entries(required)
    .filter(([, value]) => !String(value || "").trim())
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required production configuration: ${missing.join(", ")}`);
  }

  if (env.JWT_SECRET === "development-secret" || env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be a unique production secret of at least 32 characters.");
  }

  if (!env.COOKIE_SECURE || !["lax", "strict"].includes(env.COOKIE_SAME_SITE)) {
    throw new Error(
      `Production cookies must be Secure with COOKIE_SAME_SITE=lax or strict (received ${JSON.stringify(
        process.env.COOKIE_SAME_SITE || ""
      )}).`
    );
  }

  if (env.ADMIN_PASSWORD === "admin" || env.ADMIN_PASSWORD.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters and must not use the default.");
  }

  if (
    !/[a-z]/.test(env.ADMIN_PASSWORD) ||
    !/[A-Z]/.test(env.ADMIN_PASSWORD) ||
    !/\d/.test(env.ADMIN_PASSWORD) ||
    !/[^A-Za-z0-9]/.test(env.ADMIN_PASSWORD)
  ) {
    throw new Error("ADMIN_PASSWORD must include upper and lowercase letters, a number, and a symbol.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.ADMIN_EMAIL)) {
    throw new Error("ADMIN_EMAIL must be a valid email address.");
  }

  const validAdminRoles = [
    "super-admin",
    "brand-growth-manager",
    "operations-manager",
    "catalog-manager",
  ];
  if (!validAdminRoles.includes(env.ADMIN_ROLE)) {
    throw new Error(`ADMIN_ROLE must be one of: ${validAdminRoles.join(", ")}.`);
  }

  const hasEmailProvider = Boolean(
    env.ZEPTOMAIL_API_KEY || (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS)
  );
  if (!hasEmailProvider) {
    throw new Error("A ZeptoMail API key or complete SMTP configuration is required for production OTP email.");
  }

  if (env.OTP_DEV_MODE) {
    throw new Error("OTP_DEV_MODE must be disabled in production.");
  }

  let clientUrl;
  try {
    clientUrl = new URL(env.CLIENT_URL);
  } catch {
    throw new Error("CLIENT_URL must be a valid HTTPS URL in production.");
  }

  if (clientUrl.protocol !== "https:") {
    throw new Error("CLIENT_URL must use HTTPS in production.");
  }
}

env.assertProductionEnv = assertProductionEnv;

module.exports = env;
