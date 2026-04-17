const ADMIN_TOKEN_KEY = "hrushe_admin_token";

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
    return;
  }

  window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
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
