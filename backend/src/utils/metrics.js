const { logEvent } = require("./logger");

function recordMetric(name, fields = {}) {
  logEvent("metric.recorded", {
    metric: name,
    ...fields,
  });
}

module.exports = {
  recordMetric,
};
