const CUSTOMER_TOKEN_KEY = "hrushe_customer_token";
export const CUSTOMER_SESSION_CHANGED_EVENT = "hrushe_customer_session_changed";

function dispatchCustomerSessionChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(CUSTOMER_SESSION_CHANGED_EVENT));
}

export function getCustomerToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(CUSTOMER_TOKEN_KEY) || "";
}

export function setCustomerToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  if (!token) {
    window.localStorage.removeItem(CUSTOMER_TOKEN_KEY);
    dispatchCustomerSessionChanged();
    return;
  }

  window.localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
  dispatchCustomerSessionChanged();
}

export function clearCustomerToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  dispatchCustomerSessionChanged();
}

export function getCustomerAuthHeaders(): Record<string, string> {
  const token = getCustomerToken();

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}
