 import "./register.css";
import { useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiUser, FiLoader, FiEye, FiEyeOff } from "react-icons/fi";
import { useState } from "react";
import { api } from "../../api/client";
import { setTokens } from "../../auth/authStorage";
import logoImg from "../../img/logo.png";

function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // حالة التحكم في إظهار كلمة المرور
  const [showPassword, setShowPassword] = useState(false);
  
  // Farm fields to collect during registration
  const [farmLocation, setFarmLocation] = useState("");
  const [cropType, setCropType] = useState("");
  const [farmSize, setFarmSize] = useState("");
  const [plantingDate, setPlantingDate] = useState("");
  const [previousDiseases, setPreviousDiseases] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1 = personal, 2 = farm

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      alert("يرجى إدخال جميع البيانات");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/api/auth/register/", {
        full_name: fullName,
        email,
        password,
        // include farm info so backend can create farm/profile at signup
        farm_location: farmLocation,
        crop_type: cropType,
        farm_size: farmSize,
        planting_date: plantingDate,
        previous_diseases: previousDiseases,
      });

      const loginRes = await api.post("/api/auth/login/", {
        email,
        password,
      });

      setTokens({
        access: loginRes.data?.access,
        refresh: loginRes.data?.refresh,
      });

      // Create a farm record for the user if backend supports it
      try {
        const farmPayload = {
          name: fullName ? `${fullName} - مزرعتي` : "مزرعتي",
          location: farmLocation || "",
          area: farmSize || null,
          area_unit: "dunam",
          crop_type: cropType || "",
          planting_date: plantingDate || null,
          notes: previousDiseases || "",
        };
        await api.post("/api/farms/", farmPayload);
      } catch (farmErr) {
        // ignore farm creation errors (user can create later in profile)
        console.warn("Failed to create farm during registration", farmErr);
      }

      const user = loginRes.data?.user;
      if (user?.role === "admin" || user?.is_staff || user?.is_superuser) {
        navigate("/admin");
      } else {
        navigate("/home");
      }
    } catch (err) {
      const message =
        err?.response?.data?.email?.[0] ||
        err?.response?.data?.detail ||
        "فشل إنشاء الحساب";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="split-login-wrapper" dir="rtl">
           <header className="top-glass-header">
            <div className="logo-area" onClick={() => navigate("/")}>
                <img src={logoImg} alt="AgriSmart" className="header-mini-logo" />
                <span className="header-brand-name">AgriSmart</span>
                </div>
            </header>
      {/* القسم الأيمن (النموذج - المساحة البيضاء) */}
      <div className="split-form-section">
        <div className="login-form-container">
          
          {/* رأس النموذج */}
          <div className="login-header">

          </div>

          {/* استخدام عنصر <form> ليتوافق مع التنسيقات. الخطوة 1: بيانات شخصية، الخطوة 2: بيانات المزرعة */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (step === 1) {
                // validate personal fields before moving to farm step
                if (!fullName || !email || !password) {
                  alert("يرجى إدخال الاسم والبريد وكلمة المرور قبل المتابعة");
                  return;
                }
                setStep(2);
                return;
              }
              // final submit from step 2
              handleRegister();
            }}
            className="clean-login-form"
          >

            {/* Step indicator */}

            {step === 1 && (
              <>
               <h2 className="login-title">إنشاء حساب جديد</h2>
                <div className="clean-input-group">
                  <label>الاسم الكامل:</label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      className="clean-input"
                      placeholder="ادخل اسمك الكامل"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                    <FiUser className="input-icon-left" />
                  </div>
                </div>

                <div className="clean-input-group">
                  <label>البريد الإلكتروني:</label>
                  <div className="input-wrapper">
                    <input
                      type="email"
                      className="clean-input"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <FiMail className="input-icon-left" />
                  </div>
                </div>

                <div className="clean-input-group">
                  <label>كلمة المرور:</label>
                  <div className="input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="clean-input has-eye"
                      placeholder="كلمة المرور الخاصة بك"
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

                <div className="form-actions">
                  <button type="submit" className="clean-register-btn" disabled={isSubmitting}>
                    التالي
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
              <h2 className="login-title">إدخال معلومات المزرعة</h2>
                <div className="clean-input-group">
                  <label>موقع المزرعة:</label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      className="clean-input"
                      placeholder="مثال: الحسكة، سوريا"
                      value={farmLocation}
                      onChange={(e) => setFarmLocation(e.target.value)}
                    />
                  </div>
                </div>

                <div className="clean-input-group">
                  <label>نوع المحصول:</label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      className="clean-input"
                      placeholder="مثال: قمح، طماطم"
                      value={cropType}
                      onChange={(e) => setCropType(e.target.value)}
                    />
                  </div>
                </div>

                <div className="clean-input-group">
                  <label>مساحة المزرعة:</label>
                  <div className="input-wrapper">
                    <input
                      type="Number"
                      className="clean-input"
                      placeholder="بـ الدونم"
                      value={farmSize}
                      onChange={(e) => setFarmSize(e.target.value)}

                    />
                  </div>
                </div>

                <div className="clean-input-group">
                  <label>تاريخ الزراعة:</label>
                  <div className="input-wrapper">
                    <input
                      type="date"
                      className="clean-input"
                      value={plantingDate}
                      onChange={(e) => setPlantingDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="clean-input-group">
                  <label>أمراض سابقة (اختياري):</label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      className="clean-input"
                      placeholder="أدخل أي أمراض سابقة"
                      value={previousDiseases}
                      onChange={(e) => setPreviousDiseases(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-actions" style={{ display: 'flex', gap: 12 }}>
                  <button type="button" className="clean-register-btn" onClick={() => setStep(1)} disabled={isSubmitting}>
                    رجوع
                  </button>
                  <button type="submit" className="clean-register-btn" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <FiLoader className="spinner-icon" style={{marginLeft: '10px'}} />
                        جاري إنشاء الحساب...
                      </>
                    ) : (
                      "إنشاء حساب"
                    )}
                  </button>
                </div>
              </>
            )}

            <div className="login-footer-links">
              <span className="text-link center-link" onClick={() => navigate("/login")}>
                هل لديك حساب بالفعل؟ تسجيل الدخول
              </span>
            </div>
          </form>

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

export default Register;