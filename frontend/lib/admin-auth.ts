export const ADMIN_SESSION_CHANGED_EVENT = "hrushe_admin_session_changed";
let hasAdminSession = false;

function dispatchAdminSessionChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(ADMIN_SESSION_CHANGED_EVENT));
}

export function getAdminToken() {
  return hasAdminSession ? "cookie-session" : "";
}

export function setAdminToken() {
  hasAdminSession = true;
  dispatchAdminSessionChanged();
}

export function clearAdminToken() {
  hasAdminSession = false;
  dispatchAdminSessionChanged();
}

export function getAdminAuthHeaders() {
  return {} as Record<string, string>;
}
