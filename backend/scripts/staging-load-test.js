require("dotenv").config();

const fs = require("fs");
const { performance } = require("perf_hooks");

const enabled = process.env.STAGING_LOAD_TEST === "true";
const baseUrl = String(process.env.LOAD_TEST_BASE_URL || "").replace(/\/+$/, "");
const totalRequests = Math.min(Number(process.env.LOAD_TEST_REQUESTS || 40), 250);
const concurrency = Math.min(Number(process.env.LOAD_TEST_CONCURRENCY || 5), 20);
const killFile = process.env.LOAD_TEST_KILL_FILE || "/tmp/hrushe-load-test-stop";

function assertSafeConfig() {
  if (!enabled) {
    throw new Error("Refusing to run. Set STAGING_LOAD_TEST=true for staging-only load tests.");
  }

  if (!baseUrl || /hrushe\.in$/i.test(new URL(baseUrl).hostname)) {
    throw new Error("LOAD_TEST_BASE_URL must be a staging URL, not production.");
  }
}

function percentile(values, fraction) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1);
  return Math.round(sorted[index]);
}

async function timedRequest(name, requestFactory) {
  const startedAt = performance.now();
  try {
    const response = await requestFactory();
    const durationMs = performance.now() - startedAt;
    await response.text().catch(() => "");
    return {
      name,
      ok: response.status < 500,
      status: response.status,
      durationMs,
    };
  } catch (error) {
    return {
      name,
      ok: false,
      status: 0,
      durationMs: performance.now() - startedAt,
      error: error.message,
    };
  }
}

function buildScenarios() {
  const adminHeaders = process.env.LOAD_TEST_ADMIN_COOKIE
    ? {
        Cookie: process.env.LOAD_TEST_ADMIN_COOKIE,
        "X-CSRF-Token": process.env.LOAD_TEST_CSRF || "",
      }
    : {};
  const checkoutPayload = process.env.LOAD_TEST_CHECKOUT_PAYLOAD_JSON
    ? JSON.parse(process.env.LOAD_TEST_CHECKOUT_PAYLOAD_JSON)
    : null;
  const productId = process.env.LOAD_TEST_PRODUCT_ID || "";
  const trackingPayload =
    process.env.LOAD_TEST_TRACK_ORDER_ID && process.env.LOAD_TEST_TRACK_EMAIL
      ? {
          orderId: process.env.LOAD_TEST_TRACK_ORDER_ID,
          email: process.env.LOAD_TEST_TRACK_EMAIL,
        }
      : null;

  return [
    {
      name: "public-products",
      request: () => fetch(`${baseUrl}/products?limit=12`),
    },
    ...(productId
      ? [
          {
            name: "product-detail",
            request: () => fetch(`${baseUrl}/products/${encodeURIComponent(productId)}`),
          },
        ]
      : []),
    ...(trackingPayload
      ? [
          {
            name: "order-tracking",
            request: () =>
              fetch(`${baseUrl}/order/track`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(trackingPayload),
              }),
          },
        ]
      : []),
    ...(checkoutPayload
      ? [
          {
            name: "checkout-create",
            request: () =>
              fetch(`${baseUrl}/order/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(checkoutPayload),
              }),
          },
        ]
      : []),
    ...(adminHeaders.Cookie
      ? [
          {
            name: "admin-reconciliation-list",
            request: () =>
              fetch(`${baseUrl}/order/reconciliation?limit=25`, {
                headers: adminHeaders,
              }),
          },
          {
            name: "admin-operations-summary",
            request: () =>
              fetch(`${baseUrl}/admin/operations/summary`, {
                headers: adminHeaders,
              }),
          },
        ]
      : []),
  ];
}

async function worker(queue, results) {
  while (queue.length > 0) {
    if (fs.existsSync(killFile)) {
      throw new Error(`Kill switch detected at ${killFile}`);
    }

    const scenario = queue.shift();
    results.push(await timedRequest(scenario.name, scenario.request));
  }
}

async function main() {
  assertSafeConfig();
  const scenarios = buildScenarios();
  if (scenarios.length === 0) {
    throw new Error("No load-test scenarios are configured.");
  }

  const queue = Array.from({ length: totalRequests }, (_, index) => scenarios[index % scenarios.length]);
  const results = [];
  const startedAt = performance.now();
  await Promise.all(
    Array.from({ length: Math.min(concurrency, queue.length) }, () => worker(queue, results))
  );
  const durationSeconds = (performance.now() - startedAt) / 1000;
  const durations = results.map((result) => result.durationMs);
  const failed = results.filter((result) => !result.ok);

  console.log(
    JSON.stringify(
      {
        environment: "staging",
        baseUrl,
        totalRequests: results.length,
        concurrency,
        durationSeconds: Number(durationSeconds.toFixed(2)),
        requestsPerSecond: Number((results.length / durationSeconds).toFixed(2)),
        p50Ms: percentile(durations, 0.5),
        p95Ms: percentile(durations, 0.95),
        p99Ms: percentile(durations, 0.99),
        errorRate: Number((failed.length / Math.max(results.length, 1)).toFixed(4)),
        byScenario: Object.fromEntries(
          scenarios.map((scenario) => {
            const scenarioResults = results.filter((result) => result.name === scenario.name);
            return [
              scenario.name,
              {
                count: scenarioResults.length,
                failures: scenarioResults.filter((result) => !result.ok).length,
                p95Ms: percentile(
                  scenarioResults.map((result) => result.durationMs),
                  0.95
                ),
              },
            ];
          })
        ),
      },
      null,
      2
    )
  );
}

if (require.main === module && process.env.npm_lifecycle_event !== "test") {
  main().catch((error) => {
    console.error("Staging load test failed", { message: error.message });
    process.exitCode = 1;
  });
}

module.exports = {
  assertSafeConfig,
  buildScenarios,
  percentile,
};
