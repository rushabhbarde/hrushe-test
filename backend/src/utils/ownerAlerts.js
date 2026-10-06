const env = require("../config/env");
const { logEvent } = require("./logger");

const ALERT_THROTTLE_MS = 30 * 60 * 1000;
const lastSentAt = new Map();

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/**
 * Email the shop owner when something needs a human: a server error, a payment that needs a
 * manual check, a failed backup. One email per `key` every 30 minutes at most, so a burst of
 * the same problem is one message, not hundreds. Never throws.
 */
async function sendOwnerAlert({ key, subject, lines = [] }, options = {}) {
  const now = options.now ?? Date.now();
  const recipient = String(options.recipient ?? env.ALERT_EMAIL ?? "").trim();
  const enabled = options.enabled ?? env.NODE_ENV === "production";

  if (!enabled || !recipient) {
    return { sent: false, reason: "disabled" };
  }

  const previous = lastSentAt.get(key);
  if (previous && now - previous < ALERT_THROTTLE_MS) {
    return { sent: false, reason: "throttled" };
  }
  lastSentAt.set(key, now);

  const text = [...lines, "", `Time: ${new Date(now).toISOString()}`, "Sent by the HRUSHE backend."].join("\n");
  const html = `<p>${[...lines].map(escapeHtml).join("<br>")}</p><p style="color:#6b6760">Time: ${new Date(now).toISOString()}<br>Sent by the HRUSHE backend.</p>`;

  try {
    // Required here, not at the top: the mailer reports its own failures through error capture.
    const send = options.send || require("./mailer").sendEmail;
    const result = await send({ to: recipient, subject: `[HRUSHE] ${subject}`, text, html });
    return { sent: result?.delivered !== false, reason: result?.reason || "" };
  } catch (error) {
    logEvent("owner_alert.failed", { key, message: error?.message }, "error");
    return { sent: false, reason: "send_failed" };
  }
}

function resetOwnerAlertsForTests() {
  lastSentAt.clear();
}

module.exports = { ALERT_THROTTLE_MS, resetOwnerAlertsForTests, sendOwnerAlert };
