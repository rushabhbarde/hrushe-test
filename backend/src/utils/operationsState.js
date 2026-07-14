const state = {
  lastReconciliationScanAt: null,
  lastCriticalErrorAt: null,
};

function markReconciliationScan(date = new Date()) {
  state.lastReconciliationScanAt = date;
}

function markCriticalError(date = new Date()) {
  state.lastCriticalErrorAt = date;
}

function getOperationsState() {
  return {
    lastReconciliationScanAt: state.lastReconciliationScanAt,
    lastCriticalErrorAt: state.lastCriticalErrorAt,
  };
}

module.exports = {
  getOperationsState,
  markCriticalError,
  markReconciliationScan,
};
