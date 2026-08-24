require("dotenv").config();

const mongoose = require("mongoose");
const env = require("../src/config/env");
const {
  CHECKOUT_ATTEMPT_INDEX,
  describeMongoTarget,
  runCheckoutAttemptIndexCommand,
} = require("../src/services/checkoutAttemptIndex");

const args = new Set(process.argv.slice(2));
const mode = args.has("--create") ? "create" : "check";
const confirmProduction =
  args.has("--confirm-production") ||
  process.env.CHECKOUT_ATTEMPT_INDEX_CONFIRM_PRODUCTION === "true";
const production = String(env.APP_ENV || env.NODE_ENV || "")
  .trim()
  .toLowerCase() === "production";

async function printResult(result) {
  console.log(
    JSON.stringify(
      {
        ok: result.ok,
        mode: result.mode,
        status: result.status,
        reason: result.reason,
        created: result.created === true,
        target: result.target,
        index: {
          name: CHECKOUT_ATTEMPT_INDEX.name,
          key: CHECKOUT_ATTEMPT_INDEX.key,
          unique: CHECKOUT_ATTEMPT_INDEX.unique,
          partialFilterExpression: CHECKOUT_ATTEMPT_INDEX.partialFilterExpression,
        },
        note:
          "This controlled verifier is authoritative for rollout; do not rely on Mongoose autoIndex in production.",
      },
      null,
      2
    )
  );
}

async function main() {
  const target = describeMongoTarget();

  if (production && !confirmProduction) {
    await printResult({
      ok: false,
      mode,
      status: "blocked",
      reason: "production-confirmation-required",
      target,
    });
    process.exitCode = 1;
    return;
  }

  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 5000),
  });

  const result = await runCheckoutAttemptIndexCommand({
    mode,
    allowCreate: args.has("--create"),
    confirmProduction,
    production,
    target,
  });

  await printResult(result);

  if (!result.ok) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(
        "Checkout attempt index verification failed",
        JSON.stringify(
          {
            message: error?.message || "Unknown error",
            target: describeMongoTarget(),
          },
          null,
          2
        )
      );
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.disconnect().catch(() => undefined);
    });
}
