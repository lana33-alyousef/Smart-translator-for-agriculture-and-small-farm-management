import  { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Scheduler.css";
import Navbar from "../../Component/Navbar/Navbar";
import { api } from "../../api/client";

// ================= القواميس (Dictionaries) =================
const citiesList = [
  { ar: "دمشق", en: "Damascus" }, { ar: "حلب", en: "Aleppo" }, { ar: "حمص", en: "Homs" },
  { ar: "حماة", en: "Hama" }, { ar: "اللاذقية", en: "Latakia" }, { ar: "طرطوس", en: "Tartus" },
  { ar: "إدلب", en: "Idlib" }, { ar: "الرقة", en: "Raqqa" }, { ar: "دير الزور", en: "Deir ez-Zor" },
  { ar: "الحسكة", en: "Al-Hasakah" }, { ar: "درعا", en: "Daraa" }, { ar: "السويداء", en: "As-Suwayda" },
  { ar: "القنيطرة", en: "Quneitra" }
];

const cropsList = [
  { ar: "قمح", en: "Wheat" }, { ar: "شعير", en: "Barley" }, { ar: "ذرة", en: "Corn" },
  { ar: "أرز", en: "Rice" }, { ar: "ذرة بيضاء (سورغم)", en: "Sorghum" }, { ar: "دخن", en: "Millet" },
  { ar: "شوفان", en: "Oats" }, { ar: "طماطم (بندورة)", en: "Tomato" }, { ar: "بطاطا", en: "Potato" },
  { ar: "بصل", en: "Onion" }, { ar: "ثوم", en: "Garlic" }, { ar: "خيار", en: "Cucumber" },
  { ar: "باذنجان", en: "Eggplant" }, { ar: "فلفل (فليفلة)", en: "Pepper" }, { ar: "كوسا", en: "Zucchini" },
  { ar: "جزر", en: "Carrot" }, { ar: "ملفوف (كرنب)", en: "Cabbage" }, { ar: "قرنبيط (زهرة)", en: "Cauliflower" },
  { ar: "خس", en: "Lettuce" }, { ar: "سبانخ", en: "Spinach" }, { ar: "قرع", en: "Pumpkin" },
  { ar: "فول الصويا", en: "Soybean" }, { ar: "عدس", en: "Lentil" }, { ar: "حمص", en: "Chickpea" },
  { ar: "بازلاء", en: "Peas" }, { ar: "فاصولياء", en: "Beans" }, { ar: "فول سوداني", en: "Peanut" },
  { ar: "تفاح", en: "Apple" }, { ar: "عنب", en: "Grape" }, { ar: "زيتون", en: "Olive" },
  { ar: "حمضيات", en: "Citrus" }, { ar: "برتقال", en: "Orange" }, { ar: "ليمون", en: "Lemon" },
  { ar: "موز", en: "Banana" }, { ar: "مانجو", en: "Mango" }, { ar: "رمان", en: "Pomegranate" },
  { ar: "بطيخ أحمر", en: "Watermelon" }, { ar: "بطيخ أصفر (شمام)", en: "Melon" }, { ar: "بابايا", en: "Papaya" },
  { ar: "جوز الهند", en: "Coconut" }, { ar: "نخيل التمر", en: "Date Palm" }, { ar: "قطن", en: "Cotton" },
  { ar: "قصب السكر", en: "Sugarcane" }, { ar: "شمندر سكري", en: "Sugarbeet" }, { ar: "دوار الشمس", en: "Sunflower" },
  { ar: "قهوة (بن)", en: "Coffee" }, { ar: "جوت", en: "Jute" }
];

const getArabicName = (enValue, list) => {
  if (!enValue) return "";
  const item = list.find(opt => opt.en.toLowerCase() === enValue.toLowerCase());
  return item ? item.ar : enValue;
};

// ================= مكون القائمة المنسدلة القابلة للبحث =================
const SearchableDropdown = ({ options, placeholder, selectedValue, onSelect, name }) => {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const opt = options.find(o => o.en === selectedValue);
    if (opt) setSearch(opt.ar);
    else if (!selectedValue) setSearch("");
  }, [selectedValue, options]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o => o.ar.includes(search));

  return (
    <div className="searchable-dropdown" ref={wrapperRef}>
      <input
        type="text"
        className="modern-input"
        placeholder={placeholder}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
          onSelect({ target: { name, value: "" } });
        }}
        onClick={() => setIsOpen(true)}
      />
      {isOpen && (
        <ul className="dropdown-options-list">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(opt => (
              <li
                key={opt.en}
                onClick={() => {
                  setSearch(opt.ar);
                  onSelect({ target: { name, value: opt.en } });
                  setIsOpen(false);
                }}
              >
                {opt.ar}
              </li>
            ))
          ) : (
            <li className="no-result">لا توجد نتائج مطابقة</li>
          )}
        </ul>
      )}
    </div>
  );
};

// ================= المكون الأساسي (Scheduler) =================
const Scheduler = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [activeScheduleId, setActiveScheduleId] = useState(null);
  
  const [formData, setFormData] = useState({
    city: "",
    region: "Central",
    crop: ""
  });
  
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentDisplayedDate, setCurrentDisplayedDate] = useState(new Date());

  // التحديث التلقائي وجلب البيانات من قاعدة البيانات عند التحميل
  useEffect(() => {
    let mounted = true;
    
    const fetchAndSyncSchedules = async () => {
      try {
        const { data: savedSchedules } = await api.get('/api/schedules/');
        if (!mounted) return;

        if (savedSchedules && savedSchedules.length > 0) {
          // تنسيق البيانات القادمة من الباك إند
          const formatted = savedSchedules.map(item => ({
            id: item.id,
            city: item.city,
            region: item.region,
            crop: item.crop,
            lastUpdated: item.last_updated,
            irrDate: item.irr_date,
            fertDate: item.fert_date,
            apiData: item.api_data
          }));

          setSchedules(formatted);
          setActiveScheduleId(formatted[0].id);

          const todayStr = new Date().toISOString().split('T')[0];
          const needsSync = formatted.some(sch => sch.lastUpdated !== todayStr);

          // إذا كان أحد الجداول لم يتم تحديثه اليوم، نقوم بجلب الطقس الجديد وتحديث قاعدة البيانات
          if (needsSync) {
            setIsSyncing(true);
            let updatedSchedules = [...formatted];
            
            for (let i = 0; i < updatedSchedules.length; i++) {
              if (updatedSchedules[i].lastUpdated !== todayStr) {
                try {
                  // طلب بيانات الذكاء الاصطناعي الجديدة
                  const { data: mlData } = await api.post('/api/irrigation/', { 
                    city: updatedSchedules[i].city, 
                    region_direction: updatedSchedules[i].region, 
                    crop_type: updatedSchedules[i].crop 
                  });
                  
                  if (mlData.status === 'success') {
                    const irrD = new Date();
                    const fDate = new Date(); 
                    fDate.setDate(fDate.getDate() + 3);

                    const patchPayload = {
                      api_data: mlData,
                      irr_date: irrD.toISOString(),
                      fert_date: fDate.toISOString()
                    };

                    // تحديث الجدول في قاعدة البيانات
                    const { data: savedData } = await api.patch(`/api/schedules/${updatedSchedules[i].id}/`, patchPayload);
                    
                    updatedSchedules[i] = {
                      ...updatedSchedules[i],
                      apiData: savedData.api_data,
                      lastUpdated: savedData.last_updated,
                      irrDate: savedData.irr_date,
                      fertDate: savedData.fert_date
                    };
                  }
                } catch (e) {
                  console.error("فشل تحديث الجدول رقم", updatedSchedules[i].id);
                }
              }
            }
            if (mounted) {
               setSchedules(updatedSchedules);
               setIsSyncing(false);
            }
          }
        }
      } catch (error) {
        if (error?.response?.status === 401 || error?.response?.status === 403) {
           navigate('/login');
        }
        console.error("خطأ في جلب بيانات الجدولة", error);
      }
    };

    fetchAndSyncSchedules();
    return () => { mounted = false; };
  }, [navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCalculate = async () => {
    if (!formData.city || !formData.crop) {
      alert("يرجى اختيار المحافظة والمحصول من القائمة!");
      return;
    }

    setIsCalculating(true);

    try {
      // إرسال البيانات لمحرك الذكاء الاصطناعي
      const { data } = await api.post('/api/irrigation/', { 
        city: formData.city, 
        region_direction: formData.region, 
        crop_type: formData.crop 
      });

      if (data.status === 'success') {
        const irrD = new Date();
        const fertD = new Date(); 
        fertD.setDate(fertD.getDate() + 3);

        const cropVal = data.crop || formData.crop;

        // تجهيز الكائن للإرسال لقاعدة البيانات
        const payload = {
          city: formData.city,
          region: formData.region,
          crop: cropVal,
          irr_date: irrD.toISOString(),
          fert_date: fertD.toISOString(),
          api_data: data
        };

        // التحقق إذا كان المحصول والمدينة موجودين مسبقاً لنقوم بتحديثهما بدلاً من الإضافة المكررة
        const existingSchedule = schedules.find(s => s.crop === cropVal && s.city === formData.city);
        
        let savedData;
        if (existingSchedule) {
          // تحديث السجل الموجود مسبقاً (PUT)
          const response = await api.put(`/api/schedules/${existingSchedule.id}/`, payload);
          savedData = response.data;
        } else {
          // إنشاء سجل جديد (POST)
          const response = await api.post('/api/schedules/', payload);
          savedData = response.data;
        }

        const newScheduleObj = {
          id: savedData.id, 
          city: savedData.city, 
          region: savedData.region, 
          crop: savedData.crop, 
          lastUpdated: savedData.last_updated, 
          irrDate: savedData.irr_date, 
          fertDate: savedData.fert_date, 
          apiData: savedData.api_data
        };

        setSchedules(prev => {
          if (existingSchedule) {
            return prev.map(s => s.id === existingSchedule.id ? newScheduleObj : s);
          }
          return [...prev, newScheduleObj];
        });

        setActiveScheduleId(savedData.id);
        setCurrentDisplayedDate(irrD);
        setFormData({ city: "", region: "Central", crop: "" }); 

      } else {
        window.dispatchEvent(new CustomEvent('api:notification', { detail: { message: 'خطأ من السيرفر: ' + data.message, type: 'error' } }));
      }
    } catch (error) {
      console.error(error);
      if (error?.response?.status === 403) {
        alert(error?.response?.data?.detail || error?.response?.data?.message || 'يُطلب اشتراك لتنفيذ هذه العملية.');
        navigate('/subscriptions');
        setIsCalculating(false);
        return;
      }
      window.dispatchEvent(new CustomEvent('api:notification', { detail: { message: 'فشل الاتصال بالخادم. تأكد من تشغيل الباك إيند.', type: 'error' } }));
    } finally {
      setIsCalculating(false);
    }
  };

  const clearAllData = async () => {
    if (window.confirm("هل أنت متأكد أنك تريد حذف جميع المحاصيل نهائياً من قاعدة البيانات؟")) {
      try {
        await api.delete('/api/schedules/clear/'); // الاتصال بالباك إند للحذف
        setSchedules([]);
        setActiveScheduleId(null);
      } catch (err) {
        console.error("خطأ في حذف الجداول", err);
        alert("حدث خطأ أثناء محاولة حذف البيانات");
      }
    }
  };

  const activeSchedule = schedules.find(s => s.id === activeScheduleId);
  const apiData = activeSchedule?.apiData;
  
  const irrDateObj = activeSchedule && activeSchedule.irrDate ? new Date(activeSchedule.irrDate) : null;
  const fertDateObj = activeSchedule && activeSchedule.fertDate ? new Date(activeSchedule.fertDate) : null;

  const year = currentDisplayedDate.getFullYear();
  const month = currentDisplayedDate.getMonth();
  const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const blanks = Array.from({ length: firstDayIndex }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const nextMonth = () => setCurrentDisplayedDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDisplayedDate(new Date(year, month - 1, 1));

  return (
    <div className="scheduler-modern-wrapper">
      
      <Navbar/>
      <img src="/img/ff.png" className="page-background-image" alt="" />
      <div className="scheduler-container" dir="rtl">
        
        <div className="page-header-title">
          <h1 className="title-green">نظام الري والتسميد الذكي</h1>
          <p className="subtitle">قم بجدولة محاصيلك واحصل على توصيات دقيقة بناءً على حالة الطقس</p>
        </div>

        {isSyncing && (
          <div className="sync-status-banner">
             جاري تحديث بيانات الطقس والمحاصيل لليوم الحالي... ⏳
          </div>
        )}

        {schedules.length > 0 && (
          <div className="saved-crops-bar">
            {schedules.map(sch => (
              <button
                key={sch.id}
                className={`crop-tab-btn ${activeScheduleId === sch.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveScheduleId(sch.id);
                  if(sch.irrDate) setCurrentDisplayedDate(new Date(sch.irrDate));
                }}
              >
                🌱 {getArabicName(sch.crop, cropsList)} ({getArabicName(sch.city, citiesList)})
              </button>
            ))}
            <button className="clear-data-btn" onClick={clearAllData}>🗑️ مسح الكل</button>
          </div>
        )}

        <div className="modern-glass-card input-section-card">
          <div className="input-grid-layout">
            <div className="form-group">
              <label>المدينة / المحافظة</label>
              <SearchableDropdown 
                options={citiesList} 
                name="city" 
                placeholder="ابحث عن المحافظة..." 
                selectedValue={formData.city} 
                onSelect={handleInputChange} 
              />
            </div>
            
            <div className="form-group">
              <label>اتجاه الأرض</label>
              <select name="region" className="modern-input modern-select" value={formData.region} onChange={handleInputChange}>
                <option value="Central">المنطقة الوسطى</option>
                <option value="East">المنطقة الشرقية</option>
                <option value="West">المنطقة الغربية</option>
                <option value="North">المنطقة الشمالية</option>
                <option value="South">المنطقة الجنوبية</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>نوع المحصول</label>
              <SearchableDropdown 
                options={cropsList} 
                name="crop" 
                placeholder="ابحث عن المحصول..." 
                selectedValue={formData.crop} 
                onSelect={handleInputChange} 
              />
            </div>
          </div>
          
          <button 
            className="btn-primary-calculate" 
            onClick={handleCalculate}
            disabled={isCalculating || isSyncing}
          >
            {isCalculating ? <span className="loader-spinner-small"></span> : "إضافة المحصول وجدولة بياناته"}
          </button>

          {activeSchedule && apiData && (
            <div className="results-modern-grid fade-in-up">
              <div className="result-box"><span className="res-label">المنطقة</span><span className="res-val">{apiData.region}</span></div>
              <div className="result-box"><span className="res-label">المحصول</span><span className="res-val">{getArabicName(apiData.crop, cropsList)}</span></div>
              <div className="result-box"><span className="res-label">الفصل</span><span className="res-val">{apiData.season || "ربيعي"}</span></div>
              <div className="result-box warning-box"><span className="res-label">مستوى الاحتياج</span><span className="res-val">{apiData.expected_level || "عالي"}</span></div>
              <div className="result-box"><span className="res-label">الحرارة</span><span className="res-val">{apiData.temperature}</span></div>
              <div className="result-box"><span className="res-label">الرطوبة</span><span className="res-val">{apiData.humidity}</span></div>
              <div className="result-box"><span className="res-label">المطر</span><span className="res-val">{apiData.rainfall}</span></div>
              <div className="result-box success-box"><span className="res-label">الكمية المقترحة</span><span className="res-val">{apiData.water_suggestion}</span></div>
            </div>
          )}
        </div>

        {activeSchedule && apiData && (
          <div className="schedule-dashboard-section fade-in-up">
            <h2 className="schedule-section-title">
              الجدولة الحالية لمحصول <span className="text-highlight">({getArabicName(apiData.crop, cropsList)})</span>
            </h2>
            
            <div className="schedule-layout-grid">
              
              <div className="modern-glass-card calendar-panel">
                <div className="calendar-header-nav">
                  <button className="nav-arrow-btn" onClick={prevMonth}>&lt;</button>
                  <span className="month-year-text">{monthNames[month]} {year}</span>
                  <button className="nav-arrow-btn" onClick={nextMonth}>&gt;</button>
                </div>
                
                <div className="calendar-days-grid days-header">
                  <div>الأحد</div><div>الاثنين</div><div>الثلاثاء</div><div>الأربعاء</div><div>الخميس</div><div>الجمعة</div><div>السبت</div>
                </div>
                
                <div className="calendar-days-grid">
                  {blanks.map(b => <div key={`blank-${b}`} className="cal-day empty"></div>)}
                  
                  {days.map(day => {
                    const isIrrDay = irrDateObj && day === irrDateObj.getDate() && month === irrDateObj.getMonth() && year === irrDateObj.getFullYear();
                    const isFertDay = fertDateObj && day === fertDateObj.getDate() && month === fertDateObj.getMonth() && year === fertDateObj.getFullYear();
                    
                    return (
                      <div key={day} className={`cal-day ${isIrrDay || isFertDay ? 'marked-day' : ''}`}>
                        <span className="day-number">{day}</span>
                        <div className="markers-container">
                          {isIrrDay && <span className="marker water-marker">💧</span>}
                          {isFertDay && <span className="marker fert-marker">🌱</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="schedule-details-panel">
                <div className="info-card water-info-card">
                  <div className="card-top-title">
                    <span className="icon-circle water-bg">💧</span>
                    <h3>الري الذكي</h3>
                  </div>
                  <div className="info-rows">
                    <p><strong>الوقت:</strong> اليوم {parseFloat(apiData.temperature) > 30 ? "06:00 مساءً (لتجنب التبخر)" : "06:00 صباحاً"}</p>
                    <p><strong>الكمية:</strong> {apiData.water_suggestion}</p>
                    <small className="hint-text">* يتم التحديث يومياً حسب حالة الطقس.</small>
                  </div>
                </div>

                <div className="info-card fert-info-card">
                  <div className="card-top-title">
                    <span className="icon-circle fert-bg">🌱</span>
                    <h3>التسميد الدقيق</h3>
                  </div>
                  <div className="info-rows">
                    <p><strong>الموعد:</strong> {fertDateObj?.toLocaleDateString('ar-EG')} (صباحاً)</p>
                    <p><strong>الكمية:</strong> {apiData.fert_suggestion || "2.5 كغ/دونم"}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Scheduler;