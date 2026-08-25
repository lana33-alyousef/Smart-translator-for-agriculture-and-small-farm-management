const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "authUser";
const ADMIN_ACCESS_TOKEN_KEY = "adminAccessToken";
const ADMIN_REFRESH_TOKEN_KEY = "adminRefreshToken";
const ADMIN_USER_KEY = "adminUser";

export function getAdminAccessToken() {
  try { return localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY); } catch { return null; }
}

export function getAdminRefreshToken() {
  try { return localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY); } catch { return null; }
}

export function setAdminTokens({ access, refresh }) {
  try {
    if (access) localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, access);
    if (refresh) localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, refresh);
    localStorage.setItem("isAdminAuthenticated", "true");
  } catch { /* ignore */ }
}

export function clearAdminAuth() {
  try {
    localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
    localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
    localStorage.removeItem("isAdminAuthenticated");
    localStorage.removeItem(ADMIN_USER_KEY);
  } catch { /* ignore */ }
}

export function getAccessToken() {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setTokens({ access, refresh }) {
  try {
    if (access) localStorage.setItem(ACCESS_TOKEN_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    localStorage.setItem("isAuthenticated", "true");
  } catch {
    // ignore
  }
}

export function setCurrentUser(user) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user ?? null));
  } catch {
    // ignore
  }
}

export function getCurrentUser() {
  try {
    const value = localStorage.getItem(USER_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
}

export function isAuthenticated() {
  const access = getAccessToken();
  if (access) return true;
  try {
    return localStorage.getItem("isAuthenticated") === "true";
  } catch {
    return false;
  }
}
