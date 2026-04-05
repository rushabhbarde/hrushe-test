const parseOrigins = (value) =>
  String(value || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT) || 5001,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
  ALLOWED_ORIGINS: parseOrigins(process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL),
  BACKEND_PUBLIC_URL:
    process.env.BACKEND_PUBLIC_URL ||
    `http://localhost:${Number(process.env.PORT) || 5001}`,
  MONGODB_URI:
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hrushetest",
  JWT_SECRET: process.env.JWT_SECRET || "development-secret",
  COOKIE_SAME_SITE:
    process.env.COOKIE_SAME_SITE ||
    (process.env.NODE_ENV === "production" ? "none" : "lax"),
  COOKIE_SECURE:
    process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production",
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || "",
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "",
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "",
  RAZORPAY_CURRENCY: process.env.RAZORPAY_CURRENCY || "INR",
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || "",
  OTP_DEV_MODE:
    process.env.OTP_DEV_MODE === undefined
      ? process.env.NODE_ENV !== "production"
      : process.env.OTP_DEV_MODE === "true",
  MSG91_AUTH_KEY: process.env.MSG91_AUTH_KEY || "",
  MSG91_SENDER_ID: process.env.MSG91_SENDER_ID || "",
  MSG91_DLT_TEMPLATE_ID: process.env.MSG91_DLT_TEMPLATE_ID || "",
  MSG91_COUNTRY_CODE: process.env.MSG91_COUNTRY_CODE || "91",
  MSG91_OTP_MESSAGE: process.env.MSG91_OTP_MESSAGE || "",
  MAIL_FROM: process.env.MAIL_FROM || "team@hrushe.in",
  MAIL_FROM_NAME: process.env.MAIL_FROM_NAME || "Hrushe",
  ZEPTOMAIL_API_KEY: process.env.ZEPTOMAIL_API_KEY || "",
  ZEPTOMAIL_API_URL:
    process.env.ZEPTOMAIL_API_URL || "https://api.zeptomail.com/v1.1/email",
};

module.exports = env;
