import axios from "axios";
import { getAdminAccessToken, getAdminRefreshToken, setAdminTokens, clearAdminAuth } from "../auth/authStorage";
import { getAccessToken, getRefreshToken, setTokens, clearAuth } from "../auth/authStorage";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error?.response?.status;

    // If forbidden, notify UI and clear auth (no retry)
    if (status === 403) {
      try { clearAuth(); } catch (e) {}
      // dispatch an event so components can show a message or redirect
      window.dispatchEvent(new CustomEvent('api:forbidden', { detail: { message: error?.response?.data || 'Forbidden' } }));
      return Promise.reject(error);
    }

    if (status !== 401 || original?._retry) {
      return Promise.reject(error);
    }

    const refresh = getRefreshToken();
    if (!refresh) {
      clearAuth();
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = axios.post(`${baseURL}/api/auth/refresh/`, { refresh });
      }
      const refreshRes = await refreshPromise;
      refreshPromise = null;

      const newAccess = refreshRes?.data?.access;
      if (!newAccess) throw new Error("No access token returned");

      setTokens({ access: newAccess, refresh });
      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    } catch (refreshError) {
      refreshPromise = null;
      clearAuth();
      window.dispatchEvent(new CustomEvent('api:notification', { detail: { message: 'فشل تجديد صلاحية الدخول، الرجاء تسجيل الدخول مرة أخرى', type: 'error' } }));
      window.dispatchEvent(new CustomEvent('api:forbidden', { detail: { message: 'Authentication failed' } }));
      return Promise.reject(refreshError);
    }
  },
);

// إنشاء عميل مخصص للوحة التحكم
export const adminApi = axios.create({
  baseURL,
});

adminApi.interceptors.request.use((config) => {
  const token = getAdminAccessToken(); // نستخدم توكن الإدارة
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let adminRefreshPromise = null;

adminApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error?.response?.status;

    if (status === 403) {
      try { clearAdminAuth(); } catch (e) {}
      window.dispatchEvent(new CustomEvent('adminApi:forbidden', { detail: { message: error?.response?.data || 'Forbidden' } }));
      return Promise.reject(error);
    }

    if (status !== 401 || original?._retry) {
      return Promise.reject(error);
    }

    const refresh = getAdminRefreshToken();
    if (!refresh) {
      clearAdminAuth();
      window.dispatchEvent(new CustomEvent('adminApi:notification', { detail: { message: 'انتهت الجلسة، الرجاء تسجيل الدخول', type: 'warning' } }));
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      if (!adminRefreshPromise) {
        adminRefreshPromise = axios.post(`${baseURL}/api/auth/refresh/`, { refresh });
      }
      const refreshRes = await adminRefreshPromise;
      adminRefreshPromise = null;

      const newAccess = refreshRes?.data?.access;
      if (!newAccess) throw new Error("No access token returned");

      setAdminTokens({ access: newAccess, refresh }); // تحديث توكن الإدارة
      original.headers.Authorization = `Bearer ${newAccess}`;
      return adminApi(original);
    } catch (refreshError) {
      adminRefreshPromise = null;
      clearAdminAuth();
      return Promise.reject(refreshError);
    }
  }
);