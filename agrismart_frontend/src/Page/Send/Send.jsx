import { useRef } from "react";
import "./send.css";
import AuthPageLayout from "../../Component/AuthPageLayout/AuthPageLayout";

export default function Send() {
  const inputs = useRef([]);

  const handleChange = (e, index) => {
    const value = e.target.value;

    if (value.length === 1 && index < 5) {
      inputs.current[index + 1].focus();
    }
  };
  return (
    <AuthPageLayout imagePosition="left">
      <div className="send-form-container">
        <div className="send-header">
          <img src="/img/Group.png" alt="send code" className="send-icon" />
          <h1 className="send-title">إرسال الرمز</h1>
        </div>

        <div className="input-wrapper">
          <input
            type="email"
            dir="rtl"
            className="send-input"
            placeholder="ادخل بريدك الالكتروني"
          />
        </div>

        <button className="send-button">إرسال الرمز</button>

        <p className="send-info">من فضلك قم بادخال رمز التحقق</p>

        <div className="otp-container">
          {[...Array(6)].map((_, i) => (
            <input
              key={i}
              type="text"
              maxLength="1"
              className="otp-input"
              onChange={(e) => handleChange(e, i)}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !e.target.value && i > 0) {
                  inputs.current[i - 1].focus();
                }
              }}
              ref={(el) => (inputs.current[i] = el)}
            />
          ))}
        </div>

        <button className="verify-button">تحقق</button>
      </div>
    </AuthPageLayout>
  );
}
