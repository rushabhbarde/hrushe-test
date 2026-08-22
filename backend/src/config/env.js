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
const APP_ENV_VALUE = process.env.APP_ENV || process.env.NODE_ENV || "development";
const NORMALIZED_APP_ENV = APP_ENV_VALUE.trim().toLowerCase();

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
    ...(NORMALIZED_APP_ENV === "production" ? PRODUCTION_SITE_ORIGINS : []),
  ]);

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  APP_ENV: APP_ENV_VALUE,
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
  if (NORMALIZED_APP_ENV !== "production") {
    return;
  }

  const required = {
    CLIENT_URL: process.env.CLIENT_URL,
    BACKEND_PUBLIC_URL: process.env.BACKEND_PUBLIC_URL,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
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

  const hasPlaceholderValue = (value) =>
    /(?:your-|choose-a-random|changeme|change-me|placeholder|example|development-secret|test-secret|redacted)/i.test(
      String(value || "")
    );
  const placeholderKeys = Object.entries({
    JWT_SECRET: env.JWT_SECRET,
    ADMIN_PASSWORD: env.ADMIN_PASSWORD,
    RAZORPAY_KEY_ID: env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: env.RAZORPAY_KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET: env.RAZORPAY_WEBHOOK_SECRET,
    INTERNAL_SCHEDULER_SECRET: env.INTERNAL_SCHEDULER_SECRET,
    R2_ACCESS_KEY_ID: env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: env.R2_SECRET_ACCESS_KEY,
  })
    .filter(([, value]) => hasPlaceholderValue(value))
    .map(([key]) => key);

  if (placeholderKeys.length > 0) {
    throw new Error(`Production configuration contains placeholder values: ${placeholderKeys.join(", ")}`);
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

  if (env.ENABLE_COD) {
    throw new Error("ENABLE_COD must remain disabled in production. The legacy COD path has been retired.");
  }

  if (!env.RAZORPAY_KEY_ID.startsWith("rzp_live_")) {
    throw new Error("RAZORPAY_KEY_ID must use Razorpay live mode when APP_ENV=production.");
  }

  if (env.INTERNAL_SCHEDULER_SECRET.length < 32) {
    throw new Error("INTERNAL_SCHEDULER_SECRET must be at least 32 characters in production.");
  }

  if (env.RAZORPAY_WEBHOOK_SECRET.length < 32) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET must be at least 32 characters in production.");
  }

  let clientUrl;
  let backendUrl;
  let mediaUrl;
  try {
    clientUrl = new URL(env.CLIENT_URL);
    backendUrl = new URL(env.BACKEND_PUBLIC_URL);
    mediaUrl = new URL(env.R2_PUBLIC_URL);
  } catch {
    throw new Error("CLIENT_URL, BACKEND_PUBLIC_URL, and R2_PUBLIC_URL must be valid URLs in production.");
  }

  if ([clientUrl, backendUrl, mediaUrl].some((url) => url.protocol !== "https:")) {
    throw new Error("CLIENT_URL, BACKEND_PUBLIC_URL, and R2_PUBLIC_URL must use HTTPS in production.");
  }

  const unsafeOrigin = env.ALLOWED_ORIGINS.find((origin) => {
    if (origin === "*") {
      return true;
    }
    try {
      const url = new URL(origin);
      return url.protocol !== "https:" || ["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname);
    } catch {
      return true;
    }
  });

  if (unsafeOrigin) {
    throw new Error("ALLOWED_ORIGINS must contain only explicit HTTPS production origins.");
  }
}

function hasIsolatedName(value) {
  return /(?:^|[-_.:/@])(?:staging|stage|test|qa|sandbox|prelaunch)(?:$|[-_.:/@])/i.test(value);
}

function hasProductionName(value) {
  return /(?:^|[-_.:/@])(?:prod|production)(?:$|[-_.:/@])/i.test(value);
}

function getMongoDatabaseName(uriValue) {
  try {
    const url = new URL(uriValue);
    const dbName = url.searchParams.get("dbName");
    return decodeURIComponent((dbName || url.pathname.replace(/^\/+/, "")).split("?")[0] || "");
  } catch {
    return "";
  }
}

function assertStagingEnv() {
  if (NORMALIZED_APP_ENV !== "staging") {
    return;
  }

  const required = {
    CLIENT_URL: process.env.CLIENT_URL,
    BACKEND_PUBLIC_URL: process.env.BACKEND_PUBLIC_URL,
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
    INTERNAL_SCHEDULER_SECRET: process.env.INTERNAL_SCHEDULER_SECRET,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
  };
  const missing = Object.entries(required)
    .filter(([, value]) => !String(value || "").trim())
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required staging configuration: ${missing.join(", ")}`);
  }

  if (env.JWT_SECRET === "development-secret" || env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be a unique staging secret of at least 32 characters.");
  }

  if (!env.COOKIE_SECURE || !["lax", "strict"].includes(env.COOKIE_SAME_SITE)) {
    throw new Error("Staging cookies must be Secure with COOKIE_SAME_SITE=lax or strict.");
  }

  if (env.OTP_DEV_MODE) {
    throw new Error("OTP_DEV_MODE must be disabled in staging; use an isolated email test provider.");
  }

  const hasEmailProvider = Boolean(
    env.ZEPTOMAIL_API_KEY || (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS)
  );
  if (!hasEmailProvider) {
    throw new Error("A ZeptoMail API key or complete SMTP configuration is required for staging OTP email.");
  }

  const explicitMailFrom =
    process.env.MAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_FROM || "";
  if (!explicitMailFrom || !hasIsolatedName(env.MAIL_FROM)) {
    throw new Error("MAIL_FROM must be an explicit isolated staging/test sender.");
  }

  if (env.RAZORPAY_KEY_ID.startsWith("rzp_live_")) {
    throw new Error("RAZORPAY_KEY_ID must use Razorpay test mode when APP_ENV=staging.");
  }

  if (!env.RAZORPAY_KEY_ID.startsWith("rzp_test_")) {
    throw new Error("RAZORPAY_KEY_ID must have the Razorpay test-mode prefix when APP_ENV=staging.");
  }

  const mongoDatabaseName = getMongoDatabaseName(env.MONGODB_URI);
  if (!mongoDatabaseName || hasProductionName(mongoDatabaseName) || !hasIsolatedName(mongoDatabaseName)) {
    throw new Error("MONGODB_URI must point to an isolated staging/test database when APP_ENV=staging.");
  }

  if (hasProductionName(env.R2_BUCKET_NAME) || !hasIsolatedName(env.R2_BUCKET_NAME)) {
    throw new Error("R2_BUCKET_NAME must identify an isolated staging/test media namespace.");
  }

  let clientUrl;
  let backendUrl;
  let mediaUrl;
  try {
    clientUrl = new URL(env.CLIENT_URL);
    backendUrl = new URL(env.BACKEND_PUBLIC_URL);
    mediaUrl = new URL(env.R2_PUBLIC_URL);
  } catch {
    throw new Error("CLIENT_URL, BACKEND_PUBLIC_URL, and R2_PUBLIC_URL must be valid URLs in staging.");
  }

  const forbiddenProductionHosts = new Set(["hrushe.in", "www.hrushe.in"]);
  if (
    forbiddenProductionHosts.has(clientUrl.hostname) ||
    forbiddenProductionHosts.has(backendUrl.hostname) ||
    forbiddenProductionHosts.has(mediaUrl.hostname)
  ) {
    throw new Error("Staging URLs must not use production HRUSHE hosts.");
  }
}

function assertRuntimeEnv() {
  assertProductionEnv();
  assertStagingEnv();
}

env.assertProductionEnv = assertProductionEnv;
env.assertStagingEnv = assertStagingEnv;
env.assertRuntimeEnv = assertRuntimeEnv;

module.exports = env;
