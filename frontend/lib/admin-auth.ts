const ADMIN_TOKEN_KEY = "hrushe_admin_token";
export const ADMIN_SESSION_CHANGED_EVENT = "hrushe_admin_session_changed";

function dispatchAdminSessionChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(ADMIN_SESSION_CHANGED_EVENT));
}

export function getAdminToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(ADMIN_TOKEN_KEY) || "";
}

export function setAdminToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  if (!token) {
    window.localStorage.removeItem(ADMIN_TOKEN_KEY);
    dispatchAdminSessionChanged();
    return;
  }

  window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
  dispatchAdminSessionChanged();
}

export function clearAdminToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
  dispatchAdminSessionChanged();
}

export function getAdminAuthHeaders() {
  const token = getAdminToken();

  if (!token) {
    return {} as Record<string, string>;
  }

  return {
    Authorization: `Bearer ${token}`,
  } as Record<string, string>;
}
