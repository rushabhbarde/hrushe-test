const test = require("node:test");
const assert = require("node:assert/strict");

const dbPath = require.resolve("../src/config/db");
const envPath = require.resolve("../src/config/env");
const originalEnv = { ...process.env };

function loadDbConfig(overrides = {}) {
  delete require.cache[dbPath];
  delete require.cache[envPath];
  process.env = { ...originalEnv, ...overrides };
  return require(dbPath).__private;
}

test.afterEach(() => {
  delete require.cache[dbPath];
  delete require.cache[envPath];
  process.env = { ...originalEnv };
});

test("development keeps Mongoose auto index and collection creation enabled", () => {
  const { buildMongooseConnectOptions } = loadDbConfig({
    APP_ENV: "development",
    NODE_ENV: "development",
  });

  assert.equal(buildMongooseConnectOptions().autoIndex, true);
  assert.equal(buildMongooseConnectOptions().autoCreate, true);
});

test("test keeps Mongoose auto index and collection creation enabled", () => {
  const { buildMongooseConnectOptions } = loadDbConfig({
    APP_ENV: "test",
    NODE_ENV: "test",
  });

  assert.equal(buildMongooseConnectOptions().autoIndex, true);
  assert.equal(buildMongooseConnectOptions().autoCreate, true);
});

test("staging disables Mongoose auto index and collection creation", () => {
  const { buildMongooseConnectOptions } = loadDbConfig({
    APP_ENV: "staging",
    NODE_ENV: "production",
  });

  assert.equal(buildMongooseConnectOptions().autoIndex, false);
  assert.equal(buildMongooseConnectOptions().autoCreate, false);
});

test("production disables Mongoose auto index and collection creation", () => {
  const { buildMongooseConnectOptions } = loadDbConfig({
    APP_ENV: "production",
    NODE_ENV: "production",
  });

  assert.equal(buildMongooseConnectOptions().autoIndex, false);
  assert.equal(buildMongooseConnectOptions().autoCreate, false);
});

test("deployed index control uses normalized APP_ENV values", () => {
  const { shouldDisableAutomaticIndexManagement } = loadDbConfig({
    APP_ENV: " Staging ",
    NODE_ENV: "production",
  });

  assert.equal(shouldDisableAutomaticIndexManagement(), true);
  assert.equal(shouldDisableAutomaticIndexManagement("Production"), true);
  assert.equal(shouldDisableAutomaticIndexManagement("development"), false);
});
