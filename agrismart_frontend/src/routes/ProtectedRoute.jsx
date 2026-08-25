import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { api } from "../api/client";
import { clearAuth, getCurrentUser, isAuthenticated, setCurrentUser } from "../auth/authStorage";

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const location = useLocation();
  const [user, setUser] = useState(() => getCurrentUser());
  const [isCheckingUser, setIsCheckingUser] = useState(Boolean(isAuthenticated()) && !getCurrentUser());

  useEffect(() => {
    let mounted = true;

    if (!isAuthenticated()) {
      setIsCheckingUser(false);
      return undefined;
    }

    if (user) {
      setIsCheckingUser(false);
      return undefined;
    }

    api.get("/api/me/")
      .then((response) => {
        if (!mounted) return;
        setCurrentUser(response.data);
        setUser(response.data);
      })
      .catch(() => {
        if (!mounted) return;
        clearAuth();
      })
      .finally(() => {
        if (mounted) setIsCheckingUser(false);
      });

    return () => {
      mounted = false;
    };
  }, [user]);

  // === التعديل الجديد هنا ===
  // إذا لم يكن مسجلاً، نفحص إذا كان يحاول الدخول لصفحات الأدمن نوجهه لصفحة دخول الأدمن
  if (!isAuthenticated()) {
    if (location.pathname.startsWith("/admin")) {
      return <Navigate to="/admin-login" replace state={{ from: location.pathname }} />;
    }
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (isCheckingUser) {
    return null;
  }

  const isAdmin = Boolean(user && (user.role === "admin" || user.is_staff || user.is_superuser));

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  if (!requireAdmin && isAdmin && location.pathname !== "/admin") {
    return <Navigate to="/admin" replace />;
  }

  return children;
}