import React, { useState } from "react";
import "./AdminLogin.css";
import { useNavigate } from "react-router-dom";
// تم إزالة AuthPageLayout لأننا لم نعد نحتاجه
import { FiMail, FiLock, FiArrowRight } from "react-icons/fi";
import { adminApi } from "../../api/client";
import { clearAdminAuth, setAdminTokens } from "../../auth/authStorage"; 

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("الرجاء إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminApi.post("/api/admin/login/", { email, password });
      setAdminTokens({ access: res.data?.access, refresh: res.data?.refresh });

      let user = res.data?.user;

      if (!user) {
        const meRes = await adminApi.get("/api/me/");
        user = meRes.data;
      }

      const isAdmin = Boolean(user && (user.role === "admin" || user.is_staff || user.is_superuser));

      if (!isAdmin) {
        clearAdminAuth();
        setError("هذا الحساب غير مخصص للأدمن");
        return;
      }

      navigate("/admin");
      
    } catch (err) {
      const message = err?.response?.data?.detail || "فشل تسجيل دخول الأدمن";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    /* الحاوية الجديدة التي ستغطي الشاشة بالكامل مع التدرج اللوني */
    <div className="admin-login-page" dir="rtl">
      
      <div className="admin-login-container">
        <div className="admin-login-header">
          <button type="button" className="admin-login-back" onClick={() => navigate("/home")} title="العودة للموقع">
            <FiArrowRight />
          </button>
          <h1>لوحة التحكم</h1>
          <p>يرجى تسجيل الدخول للوصول إلى لوحة التحكم</p>
        </div>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <div className="input-wrapper">
            <input
              type="email"
              className="login-input"
              placeholder="البريد الإلكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <FiMail className="input-icon" />
          </div>

          <div className="input-wrapper">
            <input
              type="password"
              className="login-input"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <FiLock className="input-icon" />
          </div>

          {error ? <div className="admin-login-error">{error}</div> : null}

          <button type="submit" className="login-button1">
            تسجيل الدخول
          </button>
        </form>
      </div>
      
    </div>
  );
}