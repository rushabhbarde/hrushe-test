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

const buildAllowedOrigins = () =>
  uniqueOrigins([
    ...parseOrigins(process.env.ALLOWED_ORIGINS),
    ...parseOrigins(process.env.CLIENT_URL),
    ...(process.env.NODE_ENV === "production" ? PRODUCTION_SITE_ORIGINS : []),
  ]);

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT) || 5001,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
  ALLOWED_ORIGINS: buildAllowedOrigins(),
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

module.exports = env;
