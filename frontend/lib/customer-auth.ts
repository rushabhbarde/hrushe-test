export const CUSTOMER_SESSION_CHANGED_EVENT = "hrushe_customer_session_changed";
let hasCustomerSession = false;

function dispatchCustomerSessionChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(CUSTOMER_SESSION_CHANGED_EVENT));
}

export function getCustomerToken() {
  return hasCustomerSession ? "cookie-session" : "";
}

export function setCustomerToken() {
  hasCustomerSession = true;
  dispatchCustomerSessionChanged();
}

export function clearCustomerToken() {
  hasCustomerSession = false;
  dispatchCustomerSessionChanged();
}

export function getCustomerAuthHeaders(): Record<string, string> {
  return {};
}
