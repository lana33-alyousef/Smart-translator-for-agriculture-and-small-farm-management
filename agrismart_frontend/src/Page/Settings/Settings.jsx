 

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
 
import { MdOutlineDarkMode, MdOutlineLightMode } from "react-icons/md";
import { PiPlant } from "react-icons/pi";
import "./Settings.css";
import { useTheme } from "../../ThemeContext";
import { api } from "../../api/client"; 
import { 
  FiLogOut, FiUser, FiSearch, FiSettings, 
  FiBell, FiFileText, FiMapPin, FiGlobe, FiLoader, FiHome 
} from "react-icons/fi";
import AccountSettings from "../AccountSettings/AccountSettings";
import FarmSettings from "../FarmSettings/FarmSettings";
import NotificationsSettings from "../NotificationsSettings/NotificationsSettings";
import ReportsSettings from "../ReportsSettings/ReportsSettings";
import { clearAuth } from "../../auth/authStorage";
 

const sidebarItems = [
  { id: "general", label: "الإعدادات العامة", icon: FiSettings },
];

const locationsList = [
  { value: "الحسكة، سوريا", label: "الحسكة، سوريا" },
  { value: "دمشق، سوريا", label: "دمشق، سوريا" },
  { value: "حلب، سوريا", label: "حلب، سوريا" },
  { value: "حمص، سوريا", label: "حمص، سوريا" },
  { value: "اللاذقية، سوريا", label: "اللاذقية، سوريا" },
  { value: "طرطوس، سوريا", label: "طرطوس، سوريا" },
  { value: "درعا، سوريا", label: "درعا، سوريا" },
  { value: "السويداء، سوريا", label: "السويداء، سوريا" },
  { value: "دير الزور، سوريا", label: "دير الزور، سوريا" },
  { value: "الرقة، سوريا", label: "الرقة، سوريا" },
  { value: "إدلب، سوريا", label: "إدلب، سوريا" },
  { value: "حماة، سوريا", label: "حماة، سوريا" },
];

export default function Settings() {
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("general");
  
 
  const [currentLang, setCurrentLang] = useState(() => {
    const savedLang = localStorage.getItem("app_lang");
    if (savedLang) return savedLang;
    
    const googleCookie = document.cookie.split("; ").find(row => row.startsWith("googtrans="));
    if (googleCookie) {
      return googleCookie.split("=")[1].endsWith("/en") ? "en" : "ar";
    }
    return "ar";
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem("notifications_enabled");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [farmId, setFarmId] = useState(null); 
  const [farmLocation, setFarmLocation] = useState("جاري التحميل..."); 
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  
  useEffect(() => {
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "ar",
            includedLanguages: "ar,en",
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          "google_translate_element"
        );
      }
    };

    const id = "google-translate-script";
    if (!document.getElementById(id)) {
      const addScript = document.createElement("script");
      addScript.id = id;
      addScript.type = "text/javascript";
      addScript.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      document.body.appendChild(addScript);
    }
  }, []);

  
  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setCurrentLang(lang);
    localStorage.setItem("app_lang", lang);

    
    const cookieDomain = window.location.hostname === "localhost" ? "" : `; domain=.${window.location.hostname}`;

    if (lang === "en") {
      document.cookie = `googtrans=/ar/en; path=/;${cookieDomain}`;
      document.cookie = "googtrans=/ar/en; path=/";
    } else {
      document.cookie = `googtrans=/ar/ar; path=/;${cookieDomain}`;
      document.cookie = "googtrans=/ar/ar; path=/";
    }

   
    window.location.reload();
  };












  
  useEffect(() => {
    if (activeTab === "general") {
      const fetchFarmData = async () => {
        try {
          const res = await api.get("/api/farms/");
          const farm = Array.isArray(res.data) ? res.data[0] : res.data;
          if (farm) {
            setFarmId(farm.id);
            setFarmLocation(farm.location || "لم يتم تحديد موقع");
          }
        } catch (err) {
          console.error("فشل جلب بيانات المزرعة:", err);
          setFarmLocation("فشل تحميل الموقع");
        }
      };
      fetchFarmData();
    }
  }, [activeTab]);

  const handleSaveLocation = async () => {
    if (!farmId) {
      alert("لم يتم العثور على بيانات المزرعة لتحديثها.");
      return;
    }
    setIsLoadingLocation(true);
    try {
      await api.patch(`/api/farms/${farmId}/`, {
        location: farmLocation
      });
      setIsEditingLocation(false);
    } catch (err) {
      console.error("فشل تحديث موقع المزرعة:", err);
      alert("حدث خطأ أثناء حفظ الموقع الجديد.");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleLogout = () => {
    const ok = window.confirm("هل أنت متأكد أنك تريد تسجيل الخروج؟");
    if (!ok) return;
    try {
      clearAuth();
    } catch {
      // ignore
    }
    navigate("/login");
  };

  return (
    <div className="modern-settings-page" dir={currentLang === "ar" ? "rtl" : "ltr" }>
      
      {/* 🔮 عنصر محرك جوجل - مخفي عن المستخدم وضروري جداً لبناء الترجمة الخلفية */}
      <div id="google_translate_element" style={{ position: "absolute", top: "-9999px", opacity: 0 }}></div>

      <div className="settings-container-grid">
        
        <aside className="settings-sidebar">
          <Link to="/home" className="sidebar-brand-link">
            <img src="/img/logo.png" alt="AgriSmart" />
            <span>AgriSmart</span>
          </Link>

          <nav className="sidebar-nav-menu">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`nav-menu-btn ${activeTab === item.id ? "active" : ""}`}
                  onClick={() => setActiveTab(item.id)}>
                  <Icon className="nav-icon" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <button type="button" className="sidebar-logout-btn" onClick={handleLogout}>
            <FiLogOut className="nav-icon" />
            <span>تسجيل الخروج</span>
          </button>
        </aside>

        <main className="settings-main-content">
          <header className="main-header-topbar">
            <div className="header-title-wrapper">
              <h1>الإعدادات</h1>
              <p>إدارة حسابك وتفضيلات النظام</p>
            </div>
         <button 
    type="button" 
    className="home-redirect-btn"
    onClick={() => navigate("/home")}
  >
    <FiHome className="btn-icon" />
    <span>العودة للرئيسية</span>
  </button>
          </header>

          <div className="mobile-tabs-container">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`mobile-tab-btn ${activeTab === item.id ? "active" : ""}`}
                  onClick={() => setActiveTab(item.id)}>
                  <Icon className="mobile-tab-icon" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <section className="settings-content-card glass-card">
            {activeTab === "general" && (
              <div className="general-settings-wrapper">
                <h2 className="section-title">التفضيلات العامة</h2>
                
                {/* خيار تحويل اللغة الشامل للموقع ككل */}
                <div className="setting-row">
                  <div className="setting-info">
                    <FiGlobe className="setting-icon" />
                    <div>
                      <h3>لغة العرض</h3>
                      <p>اختر اللغة المفضلة لواجهة المستخدم</p>
                    </div>
                  </div>
                  <div className="setting-action">



                    
<select className="lang-select-custom" value={currentLang} onChange={handleLanguageChange}>
  <option value="ar">العربية</option>
  <option value="en">English</option>
</select>
                    {/* <select 
                      className="modern-select  " 
                      value={currentLang} 
                      onChange={handleLanguageChange}
                    >
                      <option value="ar">العربية</option>
                      <option value="en">English</option>
                    </select> */}
                  </div>
                </div>

                {/* خيار الوضع الليلي */}
                <div className="setting-row">
                  <div className="setting-info">
                    {isDarkMode ? <MdOutlineDarkMode className="setting-icon" /> : <MdOutlineLightMode className="setting-icon" />}
                    <div>
                      <h3>المظهر (الوضع الليلي)</h3>
                      <p>تغيير ألوان الواجهة لتقليل إجهاد العين</p>
                    </div>
                  </div>
                  <div className="setting-action">
                     <label className="custom-toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={isDarkMode} 
                        onChange={toggleTheme} 
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                {/* موقع المزرعة */}
                <div className="setting-row">
                  <div className="setting-info">
                    <FiMapPin className="setting-icon" />
                    <div>
                      <h3>موقع المزرعة (المنطقة الزمنية)</h3>
                      <p>{farmLocation}</p>
                    </div>
                  </div>
                  <div className="setting-action">
                    {isEditingLocation ? (
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <select 
                          className="modern-select"
                          value={locationsList.some(l => l.value === farmLocation) ? farmLocation : ""}
                          onChange={(e) => setFarmLocation(e.target.value)}
                        >
                          <option value="" disabled>اختر منطقة جديدة...</option>
                          {locationsList.map((loc) => (
                            <option key={loc.value} value={loc.value}>
                              {loc.label}
                            </option>
                          ))}
                        </select>
                        <button 
                          className="modern-btn-outline" 
                          style={{ padding: "6px 14px", fontSize: "14px", backgroundColor: "#2e7d32", color: "#fff", border: "none" }}
                          onClick={handleSaveLocation}
                          disabled={isLoadingLocation}
                        >
                          {isLoadingLocation ? <FiLoader className="spinner-icon" /> : "حفظ"}
                        </button>
                      </div>
                    ) : (
                      <button 
                        className="modern-btn-outline"
                        onClick={() => setIsEditingLocation(true)}
                      >
                        تغيير
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}