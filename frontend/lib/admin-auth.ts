export const ADMIN_SESSION_CHANGED_EVENT = "hrushe_admin_session_changed";
let hasAdminSession = false;
let adminTokenMemory = "";
const ADMIN_TOKEN_STORAGE_KEY = "hrushe-admin-token";

function dispatchAdminSessionChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(ADMIN_SESSION_CHANGED_EVENT));
}

export function getAdminToken() {
  if (adminTokenMemory) {
    return adminTokenMemory;
  }

  if (typeof window !== "undefined") {
    adminTokenMemory = window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || "";

    if (adminTokenMemory) {
      hasAdminSession = true;
      return adminTokenMemory;
    }
  }

  return hasAdminSession ? "cookie-session" : "";
}

export function setAdminToken(token?: string) {
  if (token) {
    adminTokenMemory = token;

    if (typeof window !== "undefined") {
      window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
    }
  }

  hasAdminSession = true;
  dispatchAdminSessionChanged();
}

export function clearAdminToken() {
  hasAdminSession = false;
  adminTokenMemory = "";

  if (typeof window !== "undefined") {
    window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
  }

  dispatchAdminSessionChanged();
}

export function getAdminAuthHeaders() {
  const token = getAdminToken();

  if (!token || token === "cookie-session") {
    return {} as Record<string, string>;
  }

  return { Authorization: `Bearer ${token}` };
}
