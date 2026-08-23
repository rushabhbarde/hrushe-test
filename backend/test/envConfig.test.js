const test = require("node:test");
const assert = require("node:assert/strict");

const envPath = require.resolve("../src/config/env");
const originalEnv = { ...process.env };

function loadEnv(overrides = {}) {
  delete require.cache[envPath];
  process.env = { ...originalEnv, ...overrides };
  return require(envPath);
}

test.afterEach(() => {
  delete require.cache[envPath];
  process.env = { ...originalEnv };
});

test("staging config rejects Razorpay live keys without exposing values", () => {
  const env = loadEnv({
    APP_ENV: "staging",
    NODE_ENV: "production",
    CLIENT_URL: "https://staging.hrushe.example",
    BACKEND_PUBLIC_URL: "https://api-staging.hrushe.example",
    MONGODB_URI: "mongodb+srv://cluster.example/hrushe-staging",
    JWT_SECRET: "staging-secret-with-more-than-32-characters",
    RAZORPAY_KEY_ID: "rzp_live_redacted",
    RAZORPAY_KEY_SECRET: "test-secret",
    RAZORPAY_WEBHOOK_SECRET: "webhook-secret",
    INTERNAL_SCHEDULER_SECRET: "scheduler-secret",
    R2_BUCKET_NAME: "hrushe-staging-media",
    R2_PUBLIC_URL: "https://media-staging.hrushe.example",
    MAIL_FROM: "staging-mailbox@hrushe-test.example",
    SMTP_HOST: "smtp.staging-mail.test",
    SMTP_USER: "smtp-user",
    SMTP_PASS: "smtp-password",
    OTP_DEV_MODE: "false",
    COOKIE_SECURE: "true",
    COOKIE_SAME_SITE: "lax",
  });

  assert.throws(
    () => env.assertStagingEnv(),
    (error) =>
      /Razorpay test mode/.test(error.message) &&
      !error.message.includes("rzp_live_redacted")
  );
});

test("staging config requires isolated database and media names", () => {
  const env = loadEnv({
    APP_ENV: "staging",
    NODE_ENV: "production",
    CLIENT_URL: "https://staging.hrushe.example",
    BACKEND_PUBLIC_URL: "https://api-staging.hrushe.example",
    MONGODB_URI: "mongodb+srv://cluster.example/hrushe-production",
    JWT_SECRET: "staging-secret-with-more-than-32-characters",
    RAZORPAY_KEY_ID: "rzp_test_1234567890",
    RAZORPAY_KEY_SECRET: "test-secret",
    RAZORPAY_WEBHOOK_SECRET: "webhook-secret",
    INTERNAL_SCHEDULER_SECRET: "scheduler-secret",
    R2_BUCKET_NAME: "hrushe-production-media",
    R2_PUBLIC_URL: "https://media-staging.hrushe.example",
    MAIL_FROM: "staging-mailbox@hrushe-test.example",
    SMTP_HOST: "smtp.staging-mail.test",
    SMTP_USER: "smtp-user",
    SMTP_PASS: "smtp-password",
    OTP_DEV_MODE: "false",
    COOKIE_SECURE: "true",
    COOKIE_SAME_SITE: "lax",
  });

  assert.throws(() => env.assertStagingEnv(), /isolated staging\/test database/i);
});

test("staging config accepts redacted test-mode isolated settings", () => {
  const env = loadEnv({
    APP_ENV: "staging",
    NODE_ENV: "production",
    CLIENT_URL: "https://staging.hrushe.example",
    BACKEND_PUBLIC_URL: "https://api-staging.hrushe.example",
    MONGODB_URI: "mongodb+srv://cluster.example/hrushe-staging",
    JWT_SECRET: "staging-secret-with-more-than-32-characters",
    RAZORPAY_KEY_ID: "rzp_test_1234567890",
    RAZORPAY_KEY_SECRET: "test-secret",
    RAZORPAY_WEBHOOK_SECRET: "webhook-secret",
    INTERNAL_SCHEDULER_SECRET: "scheduler-secret",
    R2_BUCKET_NAME: "hrushe-staging-media",
    R2_PUBLIC_URL: "https://media-staging.hrushe.example",
    MAIL_FROM: "staging-mailbox@hrushe-test.example",
    SMTP_HOST: "smtp.staging-mail.test",
    SMTP_USER: "smtp-user",
    SMTP_PASS: "smtp-password",
    OTP_DEV_MODE: "false",
    COOKIE_SECURE: "true",
    COOKIE_SAME_SITE: "lax",
  });

  assert.doesNotThrow(() => env.assertStagingEnv());
  assert.equal(env.ALLOWED_ORIGINS.includes("https://hrushe.in"), false);
  assert.equal(env.ALLOWED_ORIGINS.includes("https://www.hrushe.in"), false);
});

test("staging config requires isolated email test delivery", () => {
  const env = loadEnv({
    APP_ENV: "staging",
    NODE_ENV: "production",
    CLIENT_URL: "https://staging.hrushe.example",
    BACKEND_PUBLIC_URL: "https://api-staging.hrushe.example",
    MONGODB_URI: "mongodb+srv://cluster.example/hrushe-staging",
    JWT_SECRET: "staging-secret-with-more-than-32-characters",
    RAZORPAY_KEY_ID: "rzp_test_1234567890",
    RAZORPAY_KEY_SECRET: "test-secret",
    RAZORPAY_WEBHOOK_SECRET: "webhook-secret",
    INTERNAL_SCHEDULER_SECRET: "scheduler-secret",
    R2_BUCKET_NAME: "hrushe-staging-media",
    R2_PUBLIC_URL: "https://media-staging.hrushe.example",
    MAIL_FROM: "team@hrushe.in",
    OTP_DEV_MODE: "true",
    COOKIE_SECURE: "true",
    COOKIE_SAME_SITE: "lax",
  });

  assert.throws(
    () => env.assertStagingEnv(),
    /OTP_DEV_MODE must be disabled in staging/
  );
});

test("production config rejects COD and placeholder secrets", () => {
  const env = loadEnv({
    APP_ENV: "production",
    NODE_ENV: "production",
    CLIENT_URL: "https://hrushe.in",
    BACKEND_PUBLIC_URL: "https://api.hrushe.in",
    ALLOWED_ORIGINS: "https://hrushe.in,https://www.hrushe.in",
    MONGODB_URI: "mongodb+srv://cluster.example/hrushe-production",
    JWT_SECRET: "development-secret",
    ADMIN_EMAIL: "admin@hrushe.in",
    ADMIN_PASSWORD: "StrongPassword1!",
    RAZORPAY_KEY_ID: "rzp_live_placeholder",
    RAZORPAY_KEY_SECRET: "choose-a-random-secret",
    RAZORPAY_WEBHOOK_SECRET: "choose-a-random-webhook-secret",
    INTERNAL_SCHEDULER_SECRET: "choose-a-random-scheduler-secret",
    R2_ACCOUNT_ID: "account",
    R2_ACCESS_KEY_ID: "access",
    R2_SECRET_ACCESS_KEY: "secret",
    R2_BUCKET_NAME: "hrushe-production-media",
    R2_PUBLIC_URL: "https://media.hrushe.in",
    MAIL_FROM: "team@hrushe.in",
    ZEPTOMAIL_API_KEY: "zepto-key",
    OTP_DEV_MODE: "false",
    COOKIE_SECURE: "true",
    COOKIE_SAME_SITE: "lax",
    ENABLE_COD: "true",
  });

  assert.throws(
    () => env.assertProductionEnv(),
    /placeholder values/i
  );
});

test("production config rejects unsafe origins and non-live Razorpay mode", () => {
  const env = loadEnv({
    APP_ENV: "production",
    NODE_ENV: "production",
    CLIENT_URL: "https://hrushe.in",
    BACKEND_PUBLIC_URL: "https://api.hrushe.in",
    ALLOWED_ORIGINS: "http://localhost:3000",
    MONGODB_URI: "mongodb+srv://cluster.example/hrushe-production",
    JWT_SECRET: "production-secret-with-more-than-32-characters",
    ADMIN_EMAIL: "admin@hrushe.in",
    ADMIN_PASSWORD: "StrongPassword1!",
    RAZORPAY_KEY_ID: "rzp_test_1234567890",
    RAZORPAY_KEY_SECRET: "live-secret-with-more-than-32-characters",
    RAZORPAY_WEBHOOK_SECRET: "webhook-secret-with-more-than-32-characters",
    INTERNAL_SCHEDULER_SECRET: "scheduler-secret-with-more-than-32-characters",
    R2_ACCOUNT_ID: "account",
    R2_ACCESS_KEY_ID: "access-key",
    R2_SECRET_ACCESS_KEY: "secret-key",
    R2_BUCKET_NAME: "hrushe-production-media",
    R2_PUBLIC_URL: "https://media.hrushe.in",
    MAIL_FROM: "team@hrushe.in",
    ZEPTOMAIL_API_KEY: "zepto-key",
    OTP_DEV_MODE: "false",
    COOKIE_SECURE: "true",
    COOKIE_SAME_SITE: "lax",
    ENABLE_COD: "false",
  });

  assert.throws(
    () => env.assertProductionEnv(),
    /Razorpay live mode|ALLOWED_ORIGINS/i
  );
});

test("production config accepts HRUSHE Razorpay webhook secret alias", () => {
  const env = loadEnv({
    APP_ENV: "production",
    NODE_ENV: "production",
    CLIENT_URL: "https://hrushe.in",
    BACKEND_PUBLIC_URL: "https://api.hrushe.in",
    ALLOWED_ORIGINS: "https://hrushe.in,https://www.hrushe.in",
    MONGODB_URI: "mongodb+srv://cluster.example/hrushe-production",
    JWT_SECRET: "production-secret-with-more-than-32-characters",
    ADMIN_EMAIL: "admin@hrushe.in",
    ADMIN_PASSWORD: "StrongPassword1!",
    RAZORPAY_KEY_ID: "rzp_live_1234567890",
    RAZORPAY_KEY_SECRET: "live-secret-with-more-than-32-characters",
    HRUSHE_RZP_WEBHOOK_SECRET: "webhook-secret-with-more-than-32-characters",
    INTERNAL_SCHEDULER_SECRET: "scheduler-secret-with-more-than-32-characters",
    R2_ACCOUNT_ID: "account",
    R2_ACCESS_KEY_ID: "access-key",
    R2_SECRET_ACCESS_KEY: "secret-key",
    R2_BUCKET_NAME: "hrushe-production-media",
    R2_PUBLIC_URL: "https://media.hrushe.in",
    MAIL_FROM: "team@hrushe.in",
    ZEPTOMAIL_API_KEY: "zepto-key",
    OTP_DEV_MODE: "false",
    COOKIE_SECURE: "true",
    COOKIE_SAME_SITE: "lax",
    ENABLE_COD: "false",
  });

  assert.equal(
    env.RAZORPAY_WEBHOOK_SECRET,
    "webhook-secret-with-more-than-32-characters"
  );
  assert.doesNotThrow(() => env.assertProductionEnv());
});
