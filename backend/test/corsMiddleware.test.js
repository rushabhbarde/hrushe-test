const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createCorsOptions,
  isAllowedDevOrigin,
} = require("../src/middleware/corsMiddleware");

function callOrigin(options, origin) {
  return new Promise((resolve) => {
    options.origin(origin, (error, allowed) => {
      resolve({ error, allowed });
    });
  });
}

test("production CORS rejects unapproved origins as an operational 403", async () => {
  const options = createCorsOptions({
    NODE_ENV: "production",
    ALLOWED_ORIGINS: ["https://hrushe.in", "https://www.hrushe.in"],
  });

  const result = await callOrigin(options, "https://evil.example");

  assert.equal(result.allowed, undefined);
  assert.equal(result.error?.message, "CORS origin not allowed");
  assert.equal(result.error?.statusCode, 403);
  assert.equal(result.error?.isOperational, true);
});

test("production CORS accepts configured origins and non-browser requests", async () => {
  const options = createCorsOptions({
    NODE_ENV: "production",
    ALLOWED_ORIGINS: ["https://hrushe.in"],
  });

  assert.deepEqual(await callOrigin(options, "https://hrushe.in"), {
    error: null,
    allowed: true,
  });
  assert.deepEqual(await callOrigin(options), {
    error: null,
    allowed: true,
  });
});

test("development CORS allows local browser origins", () => {
  const env = {
    NODE_ENV: "development",
    ALLOWED_ORIGINS: [],
  };

  assert.equal(isAllowedDevOrigin(env, "http://localhost:3000"), true);
  assert.equal(isAllowedDevOrigin(env, "http://127.0.0.1:5173"), true);
  assert.equal(isAllowedDevOrigin(env, "https://shop.local:3000"), true);
  assert.equal(isAllowedDevOrigin(env, "https://evil.example"), false);
});
