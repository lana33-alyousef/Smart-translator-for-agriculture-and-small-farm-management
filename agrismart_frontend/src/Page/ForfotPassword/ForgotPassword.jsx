import { useNavigate } from "react-router-dom";
import "./forgot.css";
import AuthPageLayout from "../../Component/AuthPageLayout/AuthPageLayout";

export default function ForgotPassword() {
  const navigate = useNavigate();
  return (
    <AuthPageLayout imagePosition="right">
      <div className="forgot-form-container">
        <div className="forgot-header">
          <div className="forgot-back-btn" onClick={() => navigate("/login")}>
            ←
          </div>
          <img
            src="/img/Group.png"
            alt="forgot password"
            className="forgot-icon"
          />
          <h1 className="forgot-title">إنشاء كلمة مرور جديدة</h1>
        </div>

        <div className="input-wrapper">
          <input
            type="text"
            dir="rtl"
            className="forgot-input"
            placeholder="ادخل بريدك الالكتروني"
          />
        </div>

        <div className="input-wrapper">
          <input
            type="password"
            dir="rtl"
            className="forgot-input"
            placeholder="ادخل كلمة المرور الخاصة بك"
          />
        </div>

        <div className="input-wrapper">
          <input
            type="password"
            dir="rtl"
            className="forgot-input"
            placeholder="تأكيد كلمة المرور الخاصة بك"
          />
        </div>

        <button className="forgot-button" onClick={() => navigate("/send")}>
          إرسال
        </button>
      </div>
    </AuthPageLayout>
  );
}
