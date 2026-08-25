 import React, { useState } from "react";
import "./login.css";
import { useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiArrowRight, FiCheckCircle, FiKey, FiEye, FiEyeOff } from "react-icons/fi";
import { api } from "../../api/client";
import { getCurrentUser, setCurrentUser, setTokens } from "../../auth/authStorage";
import logoImg from "../../img/logo.png";

function Login() {
  const navigate = useNavigate();

  React.useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      navigate("/home", { replace: true });
    }
  }, [navigate]);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // حالات التحكم في إظهار كلمة المرور
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // التحكم في خطوات الواجهة: LOGIN, REQUEST_OTP, VERIFY_OTP, SUCCESS
  const [step, setStep] = useState("LOGIN"); 
  
  // حالات إعادة تعيين كلمة المرور
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post("/api/auth/login/", { email, password });
      setTokens({
        access: res.data?.access,
        refresh: res.data?.refresh,
      });

      const user = res.data?.user;
      if (user) {
        setCurrentUser(user);
        navigate("/home"); 
        return;
      }
      try {
        const meRes = await api.get("/api/me/");
        setCurrentUser(meRes.data);
        navigate("/home"); 
      } catch {
        navigate("/home");
      }
    } catch (err) {
      const message = err?.response?.data?.detail || "فشل تسجيل الدخول. تأكد من صحة بياناتك.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      alert("يرجى إدخال البريد الإلكتروني أولاً");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post("/api/password-reset/", { email });
      setStep("VERIFY_OTP"); 
    } catch (err) {
      const message = err?.response?.data?.detail || "فشل إرسال الرمز. تأكد من صحة البريد الإلكتروني.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("كلمات المرور الجديدة غير متطابقة!");
      return;
    }
    if (!otp || !newPassword) {
      alert("يرجى إدخال رمز التحقق وكلمة المرور الجديدة.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/api/password-reset-confirm/", { 
        email, 
        otp, 
        new_password: newPassword 
      });
      setStep("SUCCESS"); 
    } catch (err) {
      const message = err?.response?.data?.detail || "رمز التحقق غير صحيح أو منتهي الصلاحية.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const backToLogin = () => {
    setStep("LOGIN");
    setPassword("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    // إعادة تعيين حالات العرض
    setShowPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <div className="split-login-wrapper" dir="rtl">
      <header className="top-glass-header">
        <div className="logo-area" onClick={() => navigate("/")}>
          <img src={logoImg} alt="AgriSmart" className="header-mini-logo" />
          <span className="header-brand-name">AgriSmart</span>
        </div>
      </header>

      {/* القسم الأيمن : نموذج إدخال البيانات */}
      <div className="split-form-section">
        <div className="login-form-container">
          
          <div className="login-header">
            <h2 className="login-title">
              {step === "LOGIN" ? "تسجيل الدخول" : " إعادة تعيين كلمة المرور"}
            </h2>
          </div>

          {step === "SUCCESS" ? (
            <div className="success-message">
              <FiCheckCircle size={55} />
              <h3>تم تغيير كلمة المرور بنجاح!</h3>
              <p>يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.</p>
              <button className="login-btn" onClick={backToLogin} >
               العودة لتسجيل الدخول
              </button>
            </div>
          ) : (
            <form 
              onSubmit={
                step === "LOGIN" ? handleLogin : 
                step === "REQUEST_OTP" ? handleRequestOTP : 
                handleVerifyOTP
              } 
              className="clean-login-form"
            >
              <div className="clean-input-group">
                <label>البريد الإلكتروني:</label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    className="clean-input"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={step === "VERIFY_OTP"}
                    required
                  />
                  <FiMail className="input-icon-left" />
                </div>
              </div>

              {step === "LOGIN" && (
                <>
                  <div className="clean-input-group">
                    <label>كلمة المرور:</label>
                    <div className="input-wrapper">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="clean-input has-eye"
                        placeholder="كلمة المرور"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <FiLock className="input-icon-left" />
                      <span className="input-icon-right" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </span>
                    </div>
                  </div>

                  <div className="remember-me-row">
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={rememberMe} 
                        onChange={(e) => setRememberMe(e.target.checked)} 
                      />
                      تذكر الحساب
                    </label>
                  </div>
                </>
              )}

              {step === "VERIFY_OTP" && (
                <>
                  <div className="clean-input-group">
                    <label>رمز التحقق:</label>
                    <div className="input-wrapper">
                      <input
                        type="number"
                        className="clean-input"
                        placeholder="أدخل الرمز المرسل للإيميل"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                      />
                      <FiKey className="input-icon-left" />
                    </div>
                  </div>

                  <div className="clean-input-group">
                    <label>كلمة المرور الجديدة:</label>
                    <div className="input-wrapper">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        className="clean-input has-eye"
                        placeholder="كلمة المرور الجديدة"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      <FiLock className="input-icon-left" />
                      <span className="input-icon-right" onClick={() => setShowNewPassword(!showNewPassword)}>
                        {showNewPassword ? <FiEyeOff /> : <FiEye />}
                      </span>
                    </div>
                  </div>

                  <div className="clean-input-group">
                    <label>تأكيد كلمة المرور:</label>
                    <div className="input-wrapper">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        className="clean-input has-eye"
                        placeholder="أعد إدخال كلمة المرور"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                      <FiLock className="input-icon-left" />
                      <span className="input-icon-right" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                      </span>
                    </div>
                  </div>
                </>
              )}

              <button type="submit" className="clean-login-btn" disabled={isSubmitting}>
                {isSubmitting ? " . . . . . " : 
                 step === "LOGIN" ? "تسجيل الدخول" : 
                 step === "REQUEST_OTP" ? "إرسال الرمز" : 
                 "إعادة تعيين"}
              </button>

              <div className="login-footer-links">
                {step === "LOGIN" ? (
                  <>
                    <span className="text-link" onClick={() => navigate("/register")}>
                      تسجيل حساب جديد
                    </span>
                    <span className="text-link" onClick={() => setStep("REQUEST_OTP")}>
                      نسيت كلمة المرور؟
                    </span>
                  </>
                ) : (
                  <span className="text-link center-link" onClick={backToLogin}>
                    العودة لصفحة تسجيل الدخول
                  </span>
                )}
              </div>
            </form>
          )}

        </div>
      </div>

      {/* القسم الأيسر: صورة الغلاف والشعار */}
      <div className="split-image-section">
        <div className="image-overlay-brand">
        </div>
      </div>

    </div>
  );
}

export default Login;