const crypto = require("crypto");

const endpointPath = String(process.argv[2] || "").trim();
const backendUrl = String(process.env.BACKEND_PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || "").trim();
const secret = String(process.env.INTERNAL_SCHEDULER_SECRET || "").trim();
const limit = Math.min(Math.max(Number(process.env.SCHEDULER_LIMIT) || 50, 1), 100);

async function main() {
  if (!endpointPath.startsWith("/internal/")) {
    throw new Error("Usage: node scripts/run-internal-scheduler.js /internal/<job-path>");
  }

  if (!backendUrl) {
    throw new Error("BACKEND_PUBLIC_URL or RENDER_EXTERNAL_URL is required.");
  }

  if (!secret) {
    throw new Error("INTERNAL_SCHEDULER_SECRET is required.");
  }

  const body = JSON.stringify({ limit });
  const timestamp = String(Date.now());
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
  const url = new URL(endpointPath, backendUrl.replace(/\/+$/, "/"));
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-hrushe-scheduler-timestamp": timestamp,
      "x-hrushe-scheduler-signature": signature,
    },
    body,
  });
  const responseBody = await response.text();
  let parsedBody = responseBody || null;

  if (responseBody) {
    try {
      parsedBody = JSON.parse(responseBody);
    } catch {
      parsedBody = responseBody;
    }
  }

  console.log(JSON.stringify({
    endpoint: endpointPath,
    statusCode: response.status,
    ok: response.ok,
    body: parsedBody,
  }));

  if (!response.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    endpoint: endpointPath,
    ok: false,
    error: error?.message || "Scheduler request failed.",
  }));
  process.exitCode = 1;
});
