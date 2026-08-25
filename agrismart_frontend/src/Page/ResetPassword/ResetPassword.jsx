import { useNavigate } from "react-router-dom";
import "./reset.css";
import AuthPageLayout from "../../Component/AuthPageLayout/AuthPageLayout";

export default function ResetPassword() {
  const navigate = useNavigate();
  return (
    <AuthPageLayout imagePosition="right">
      <div className="reset-form-container">
        <div className="reset-header">
          <div className="reset-back-btn" onClick={() => navigate("/login")}>
            ←
          </div>
          <img
            src="/img/Group.png"
            alt="reset password"
            className="reset-icon"
          />
          <h1 className="reset-title">إنشاء كلمة مرور جديدة</h1>
        </div>

        <div className="input-wrapper">
          <input
            type="email"
            dir="rtl"
            className="reset-input"
            placeholder="ادخل بريدك الالكتروني"
          />
        </div>

        <div className="input-wrapper">
          <input
            type="password"
            dir="rtl"
            className="reset-input"
            placeholder="ادخل كلمة المرور الخاصة بك"
          />
        </div>

        <div className="input-wrapper">
          <input
            type="password"
            dir="rtl"
            className="reset-input"
            placeholder="تأكيد كلمة المرور الخاصة بك"
          />
        </div>

        <button className="reset-button" onClick={() => navigate("/login")}>
          إرسال
        </button>
      </div>
    </AuthPageLayout>
  );
}
