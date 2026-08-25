 import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Profile.css";
import "../../Component/Navbar/Navbar.css";
import { HashLink } from 'react-router-hash-link';
import { clearAuth, setCurrentUser } from "../../auth/authStorage";
import { 
  FiMail, FiLogOut, FiX, FiUser, FiSettings,
  FiDroplet, FiArchive, FiActivity, 
  FiPieChart, FiAlertTriangle , FiStar
} from "react-icons/fi";
import { PiPlant } from "react-icons/pi";
import { api } from "../../api/client";

export default function Profile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("account");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const showBurger = true;

  // Controlled state for account fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  
  // حقول كلمة المرور (بدون القديمة)
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState(null);

  // Controlled state for farm fields
  const [farmName, setFarmName] = useState("");
  const [farmLocation, setFarmLocation] = useState("");
  const [cropType, setCropType] = useState("");
  const [farmSize, setFarmSize] = useState("");
  const [plantingDate, setPlantingDate] = useState("");
  const [previousDiseases, setPreviousDiseases] = useState("");

  const loadFarmForm = (farm) => {
    setSelectedFarmId(farm?.id || null);
    setFarmName(farm?.name || "");
    setFarmLocation(farm?.location || "");
    setCropType(farm?.crop_type || "");
    setFarmSize(farm?.area ? String(farm.area) : "");
    setPlantingDate(farm?.planting_date || "");
    setPreviousDiseases(farm?.notes || "");
    setErrors((prev) => ({ ...prev, farmName: undefined, farmLocation: undefined, farmSize: undefined, plantingDate: undefined }));
  };

  const handleSelectFarm = (farm) => {
    loadFarmForm(farm);
    if (farm && farm.id) {
      localStorage.setItem("activeFarmId", farm.id);
    }
  };

  const handleDeleteFarm = async (farmId) => {
    const confirmed = window.confirm("هل أنت متأكد من حذف هذه المزرعة؟ هذا الإجراء لا يمكن التراجع عنه.");
    if (!confirmed) return;

    try {
      await api.delete(`/api/farms/${farmId}/`);
      const updatedFarms = farms.filter((farm) => farm.id !== farmId);
      setFarms(updatedFarms);

      if (selectedFarmId === farmId) {
        if (updatedFarms.length) {
          loadFarmForm(updatedFarms[0]);
        } else {
          handleNewFarm();
        }
      }
    } catch (err) {
      alert("فشل حذف المزرعة. يرجى المحاولة لاحقاً.");
    }
  };

  const handleNewFarm = () => {
    setSelectedFarmId(null);
    setFarmName("");
    setFarmLocation("");
    setCropType("");
    setFarmSize("");
    setPlantingDate("");
    setPreviousDiseases("");
    setErrors({});
  };

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      try {
        const res = await api.get("/api/me/");
        if (!mounted) return;
        const data = res.data || {};
        
        if (data.first_name || data.last_name || data.firstName || data.lastName) {
          const f = data.first_name || data.firstName || "";
          const l = data.last_name || data.lastName || "";
          setFirstName(f);
          setLastName(l);
          setFullName(`${f} ${l}`.trim());
        } else if (data.full_name || data.fullName) {
          const full = (data.full_name || data.fullName || "").trim();
          if (full) {
            const parts = full.split(/\s+/);
            setFirstName(parts.shift() || "");
            setLastName(parts.join(" ") || "");
            setFullName(full);
          }
        }
        setEmail(data.email || "");
        setAddress(data.address || data.location || "");
        setPhone(data.phone || data.phone_number || "");
        if (data.avatar) setAvatarPreview(data.avatar);

        setCurrentUser(data);

        try {
          const farmsRes = await api.get("/api/farms/");
          const farmList = Array.isArray(farmsRes.data) ? farmsRes.data : [];
          setFarms(farmList);
          if (farmList.length) {
            loadFarmForm(farmList[0]);
            // تعيين أول مزرعة كنشطة افتراضياً
            localStorage.setItem("activeFarmId", farmList[0].id);
          } else {
            loadFarmForm(null);
            localStorage.removeItem("activeFarmId");
          }
        } catch (farmErr) {
          // ignore farm fetch errors
        }
      } catch (err) {
        // ignore - unauthenticated or endpoint missing
      }
    };
    loadProfile();
    return () => { mounted = false; };
  }, []);

  const handleSave = async () => {
    const validation = validateProfile();
    if (Object.keys(validation).length) {
      setErrors(validation);
      const first = Object.values(validation)[0];
      alert(first);
      return;
    }

    setIsSaving(true);
    try {
      const form = new FormData();
      form.append('first_name', firstName);
      form.append('last_name', lastName);
      form.append('full_name', `${firstName || ""}${lastName ? " " + lastName : ""}`);
      form.append('email', email);
      form.append('address', address);
      form.append('phone', phone);
      if (avatarFile) form.append('avatar', avatarFile);

      // إضافة كلمة المرور الجديدة في حال إدخالها
      if (newPassword) {
        await api.post('/api/change-password/', { 
               new_password: newPassword 
             });
      }

      const res = await api.patch('/api/me/', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res?.data) setCurrentUser(res.data);

      try {
        const farmPayload = {
          name: farmName || "مزرعتي",
          location: farmLocation,
          crop_type: cropType,
          area: farmSize || null,
          planting_date: plantingDate || null,
          notes: previousDiseases || "",
        };
        const farmTouched = farmName || farmLocation || cropType || farmSize || plantingDate || previousDiseases;
        if (selectedFarmId || farmTouched) {
          if (selectedFarmId) {
            await api.patch(`/api/farms/${selectedFarmId}/`, farmPayload);
          } else {
            const createRes = await api.post('/api/farms/', farmPayload);
            if (createRes?.data) setSelectedFarmId(createRes.data.id || null);
          }

          const farmsRes = await api.get("/api/farms/");
          const updatedFarms = Array.isArray(farmsRes.data) ? farmsRes.data : [];
          setFarms(updatedFarms);
        }
      } catch (farmErr) {
        console.warn('Failed to save farm', farmErr);
      }

      alert("تم حفظ التغييرات بنجاح");
      
      // تفريغ حقول كلمة المرور بعد نجاح الحفظ
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
    } catch (err) {
      const message = err?.response?.data?.detail || "فشل حفظ البيانات";
      alert(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("هل أنت متأكد من رغبتك في حذف الحساب نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.");
    if (!confirmed) return;

    try {
      await api.delete("/api/me/"); 
      clearAuth();
      navigate("/");
    } catch (err) {
      alert("فشل حذف الحساب. يرجى المحاولة لاحقاً.");
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    try {
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    } catch (e) {
      setAvatarPreview('');
    }
  };

  const validateProfile = () => {
    const e = {};
    const name = (fullName || "").trim();
    if (!name || name.length < 3) e.fullName = "يرجى إدخال اسم كامل صالح (ثلاثة أحرف على الأقل)";
    const mail = (email || "").trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!mail || !emailRegex.test(mail)) e.email = "يرجى إدخال بريد إلكتروني صالح";
    const ph = (phone || "").replace(/[^0-9]/g, "");
    if (phone && ph.length < 6) e.phone = "رقم الهاتف غير صالح";

    const farmTouched = farmName || farmLocation || cropType || farmSize || plantingDate || previousDiseases;
    if (farmTouched) {
      if (!farmName || farmName.trim().length < 3) e.farmName = "يرجى إدخال اسم مزرعة صالح";
      if (farmSize && isNaN(Number(farmSize))) e.farmSize = "مساحة المزرعة يجب أن تكون قيمة رقمية";
      if (plantingDate) {
        const d = new Date(plantingDate);
        if (Number.isNaN(d.getTime())) e.plantingDate = "تاريخ الزراعة غير صالح";
      }
    }

    if (newPassword || confirmPassword) {
      if (!newPassword || newPassword.length < 6) e.newPassword = "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل";
      if (newPassword !== confirmPassword) e.confirmPassword = "كلمتا المرور غير متطابقتين";
    }

    return e;
  };

  const renderFieldIcon = (iconType) => {
    switch (iconType) {
      case "user":
        return (
          <svg viewBox="0 0 24 24" className="field-svg" aria-hidden="true">
            <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M4 20c1.8-4.1 5-6 8-6s6.2 1.9 8 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      case "email":
        return (
          <svg viewBox="0 0 24 24" className="field-svg" aria-hidden="true">
            <rect x="3" y="6" width="18" height="12" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M4 8l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      case "address":
        return (
          <svg viewBox="0 0 24 24" className="field-svg" aria-hidden="true">
            <path d="M12 21s7-6.5 7-11a7 7 0 10-14 0c0 4.5 7 11 7 11z" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="10" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        );
      case "phone":
        return (
          <svg viewBox="0 0 24 24" className="field-svg" aria-hidden="true">
            <path d="M6 3h4l1.2 4-2.3 1.8a15 15 0 006.3 6.3l1.8-2.3L21 14v4a2 2 0 01-2.2 2A17 17 0 014 6.2 2 2 0 016 4z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        );
      case "password":
        return (
          <svg viewBox="0 0 24 24" className="field-svg" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      default:
        return null;
    }
  };

  const accountFields = [
    { id: "fullName", label: "الاسم الكامل", type: "text", placeholder: "أدخل اسمك الكامل", iconType: "user" },
    { id: "email", label: "البريد الإلكتروني", type: "email", placeholder: "example@mail.com", iconType: "email" },
    { id: "address", label: "العنوان", type: "text", placeholder: "المدينة، المنطقة", iconType: "address" },
    { id: "phone", label: "رقم الهاتف", type: "tel", placeholder: "+963 9xx xxx xxx", iconType: "phone" },
    { id: "newPassword", label: "كلمة المرور الجديدة", type: "text", placeholder: "أدخل كلمة المرور الجديدة", iconType: "password" },
    { id: "confirmPassword", label: "تأكيد كلمة المرور", type: "text", placeholder: "أعد إدخال كلمة المرور الجديدة", iconType: "password" },
  ];

  const farmFields = [
    { id: "farmName", label: "اسم المزرعة", type: "text", placeholder: "أدخل اسم المزرعة", iconType: "user" },
    { id: "farmLocation", label: "موقع المزرعة", type: "text", placeholder: "تحديد الموقع", iconType: "address" },
    { id: "cropType", label: "نوع المحصول", type: "text", placeholder: "مثال: قمح، طماطم...", iconType: "user" },
    { id: "farmSize", label: "مساحة المزرعة", type: "text", placeholder: "بـ الدونم", iconType: "address" },
    { id: "plantingDate", label: "تاريخ الزراعة", type: "date", placeholder: "تاريخ الزراعة", iconType: "email" },
    { id: "previousDiseases", label: "أمراض سابقة", type: "text", placeholder: "أدخل أي أمراض سابقة", iconType: "phone" },
  ];

  const renderFields = (fields) =>
    fields.map((field) => {
      let value = "";
      let onChange = () => {};
      switch (field.id) {
        case "fullName":
          value = fullName;
          onChange = (e) => {
            const v = e.target.value;
            setFullName(v);
            const parts = v.trim().split(/\s+/);
            setFirstName(parts.shift() || "");
            setLastName(parts.join(" ") || "");
          };
          break;
        case "email":
          value = email; onChange = (e) => setEmail(e.target.value); break;
        case "address":
          value = address; onChange = (e) => setAddress(e.target.value); break;
        case "phone":
          value = phone; onChange = (e) => setPhone(e.target.value); break;
        case "newPassword":
          value = newPassword; onChange = (e) => setNewPassword(e.target.value); break;
        case "confirmPassword":
          value = confirmPassword; onChange = (e) => setConfirmPassword(e.target.value); break;
        case "farmName":
          value = farmName; onChange = (e) => setFarmName(e.target.value); break;
        case "farmLocation":
          value = farmLocation; onChange = (e) => setFarmLocation(e.target.value); break;
        case "cropType":
          value = cropType; onChange = (e) => setCropType(e.target.value); break;
        case "farmSize":
          value = farmSize; onChange = (e) => setFarmSize(e.target.value); break;
        case "plantingDate":
          value = plantingDate; onChange = (e) => setPlantingDate(e.target.value); break;
        case "previousDiseases":
          value = previousDiseases; onChange = (e) => setPreviousDiseases(e.target.value); break;
        default:
          break;
      }

      return (
        <div className="modern-form-row" key={field.id}>
          <label htmlFor={field.id} className="modern-field-label">
            {field.label}
          </label>
          <div className="modern-input-group">
            <span className="modern-field-icon">
              {renderFieldIcon(field.iconType)}
            </span>
            <input
              id={field.id}
              type={field.type}
              className="modern-field-input"
              placeholder={field.placeholder}
              value={value}
              onChange={onChange}
            />
            {errors[field.id] && (
              <div className="field-error" style={{ color: '#d43f3a', marginTop: 6, fontSize: 12 }}>
                {errors[field.id]}
              </div>
            )}
          </div>
        </div>
      );
    });

  return (
    <div className="profile-page" dir="rtl">
      {/* الشريط العلوي */}
      <header className="profile-topbar">
        <div className="topbar-container">
          <div className="topbar-right">
            {showBurger && (
                    <button
                      className="burger-btn"
                      onClick={() => setSidebarOpen(true)}>
                      ☰
                    </button>
                  
                )}
            <div className="topbar-user-info">
              <img src="/img/Frame 127.png" alt="أيقونة المستخدم" className="topbar-avatar" />
              <h1 className="topbar-title">الملف الشخصي</h1>
            </div>
          </div>
          
          <div className="topbar-left">
            <Link className="topbar-brand" to="/">
              <span>AgriSmart</span>
              <img src="/img/logo.png" alt="AgriSmart" />
            </Link>
          </div>
        </div>
      </header>
      
      {/* القائمة الجانبية المنسدلة */}
      {sidebarOpen && (
        <>
          <div className="overlay" onClick={() => setSidebarOpen(false)}></div>
          <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
            
            <div className="sidebar__header">
              <button
                className="sidebar__closeBtn"
                onClick={() => setSidebarOpen(false)}
                aria-label="إغلاق القائمة">
                <FiX />
              </button>
              <div className="sidebar__userInfo">
                <div className="sidebar__avatar">
                  <FiUser />
                </div>
                <div className="sidebar__userDetails">
                  <span className="sidebar__welcome">مرحباً بك</span>
                </div>
              </div>
            </div>

            <div className="sidebar__content">
              <div className="sidebar__section">
              <Link className="sidebar__sectionLink" to="/profile" onClick={() => setSidebarOpen(false)}>
                <FiUser className="sidebar__icon" />
                <span>الملف الشخصي</span>
              </Link>
              <Link className="sidebar__sectionLink" to="/settings" onClick={() => setSidebarOpen(false)}>
                <FiSettings className="sidebar__icon" />
                <span>الإعدادات العامة</span>
              </Link>
              <Link className="sidebar__sectionLink" to="/subscriptions" onClick={() => setSidebarOpen(false)}>
                <FiStar className="sidebar__icon" />
                <span>باقات الاشتراك</span>
              </Link>
              </div>

              <div className="sidebar__section sidebar__section--services">
                <div className="sidebar__servicesHeader">
                  <h3 className="sidebar__sectionTitle">خدماتنا</h3>
                </div>
                <ul className="sidebar__servicesList">
                    <li>
                    <Link className="sidebar__servicesLink" to="/inventory" onClick={() => setSidebarOpen(false)}>
                      <FiArchive className="service-icon" />
                     إدارة المخزون
                    </Link>
                  </li>
                  <li>
                    <Link className="sidebar__servicesLink" to="/scheduler" onClick={() => setSidebarOpen(false)}>
                      <FiDroplet className="service-icon" />
                     جدولة الري و التسميد
                    </Link>
                  </li>
                  <li>
                    <Link className="sidebar__servicesLink" to="/reports" onClick={() => setSidebarOpen(false)}>
                      <FiPieChart className="service-icon" />
                   التقارير و السجلات
                    </Link>
                  </li>
                  <li>
                    <Link className="sidebar__servicesLink" to="/disease-alerts" onClick={() => setSidebarOpen(false)}>
                      <FiAlertTriangle className="service-icon" />
                   المحتبر الذكي
                    </Link>
                  </li>
                  <li>
                    <Link className="sidebar__servicesLink" to="/plant-growth" onClick={() => setSidebarOpen(false)}>
                      <PiPlant className="service-icon" />
                    متابعة سجل نمو النباتات
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="sidebar__footer">
              <HashLink className="sidebar__sectionLink" smooth to="/about#contact" onClick={() => setSidebarOpen(false)}>
                <FiMail className="sidebar__icon" />
                <span>تواصل معنا</span>
              </HashLink>
              <Link 
                className="sidebar__sectionLink sidebar__sectionLink--logout" 
                to="/" 
                onClick={() => {
                  clearAuth();
                  setSidebarOpen(false);
                }}
              >
                <FiLogOut className="sidebar__icon" />
                <span className="logout">تسجيل الخروج</span>
              </Link>
            </div>

          </div>
        </>
      )}

      {/* المحتوى الرئيسي */}
      <main className="profile-layout-wrap">
        <div className="profile-grid">
          
          {/* القائمة الجانبية (Sidebar) */}
          <aside className="profile-sidebar-col">
            <div className="modern-glass-card profile-side-card">
              <div className="avatar-wrap">
                    <img src={avatarPreview || '/img/الصورة الشخصية.png'} alt="المستخدم" className="avatar-img" />
                    <input id="avatarInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                    <button className="avatar-edit" type="button" aria-label="تحديث الصورة" onClick={() => document.getElementById('avatarInput').click()}>
                      📷
                    </button>
              </div>

              <div className="user-short-info">
                <h3>{fullName}</h3>
              </div>

              <div className="profile-actions">
                <Link to="/settings" className="side-action-link">الإعدادات العامة</Link>
                <button 
                  type="button" 
                  className="side-action-link danger" 
                  onClick={handleDeleteAccount}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'right' }}
                >
                  حذف الحساب
                </button>
              </div>

              <div className="farm-illustration-wrap">
                <img src="/img/undraw_online-resume_z4sp 1.png" alt="إدارة المزرعة" className="farm-illustration" />
              </div>
            </div>
          </aside>

          {/* القسم الرئيسي (Main Content) */}
          <section className="profile-main-col">
            <div className="modern-glass-card profile-main-card">
              
              {/* التبويبات (Tabs) */}
              <div className="modern-tabs-container">
                <div className="modern-tabs-track">
                  <button
                    type="button"
                    className={`modern-tab ${activeTab === "account" ? "active" : ""}`}
                    onClick={() => setActiveTab("account")}
                  >
                    معلومات الحساب
                  </button>
                  <button
                    type="button"
                    className={`modern-tab ${activeTab === "farm" ? "active" : ""}`}
                    onClick={() => setActiveTab("farm")}
                  >
                    معلومات المزرعة
                  </button>
                </div>
              </div>

              {/* النماذج (Forms) */}
              <div className="tab-content-area">
                <div className={`tab-panels-slider ${activeTab === "farm" ? "slide-left" : "slide-right"}`}>
                  <div className="tab-panel">
                    <div className="fields-grid">{renderFields(accountFields)}</div>
                  </div>
                  <div className="tab-panel">
                    <div className="farm-list-panel">
                      <div className="farm-list-header">
                        <h3>المزارع المضافة</h3>
                        <button className="modern-btn" type="button" onClick={handleNewFarm}>
                          إضافة مزرعة جديدة
                        </button>
                      </div>
                      {farms.length ? (
                        <ul className="profile-farm-list">
                          {farms.map((farm) => (
                            <li
                              key={farm.id}
                              className={`profile-farm-item ${selectedFarmId === farm.id ? 'active' : ''}`}
                              onClick={() => handleSelectFarm(farm)}
                            >
                              <div className="farm-item-content">
                                <strong>{farm.name || 'بدون اسم'}</strong>
                                <span>{farm.crop_type || 'نوع غير محدد'}</span>
                                <small>{farm.location || 'موقع غير محدد'}</small>
                              </div>
                              <button
                                type="button"
                                className="farm-item-delete-btn"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleDeleteFarm(farm.id);
                                }}
                              >
                                حذف
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="empty-farm-list">لم يتم إضافة مزرعة بعد. استخدم النموذج أدناه لإضافة أول مزرعة.</p>
                      )}
                    </div>
                    <div className="fields-grid">{renderFields(farmFields)}</div>
                  </div>
                </div>
              </div>

              {/* أزرار الحفظ */}
              <div className="action-row">
                <button type="button" className="modern-btn save-btn" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
                </button>
                <button type="button" className="modern-btn update-btn" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "جاري الحفظ..." : "تحديث البيانات"}
                </button>
              </div>

            </div>
          </section>

        </div>
      </main>
    </div>
  );
}