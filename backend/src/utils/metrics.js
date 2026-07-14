const { logEvent } = require("./logger");

function normalizeMetricFields(fields = {}) {
  const normalized = { ...fields };

  if (Object.prototype.hasOwnProperty.call(normalized, "event")) {
    normalized.metricEvent = normalized.event;
    delete normalized.event;
  }

  return normalized;
}

function recordMetric(name, fields = {}) {
  logEvent("metric.recorded", {
    metric: name,
    ...normalizeMetricFields(fields),
  });
}

module.exports = {
  normalizeMetricFields,
  recordMetric,
};
