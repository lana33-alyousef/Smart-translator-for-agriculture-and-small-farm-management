import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../Component/Navbar/Navbar";
import { FiPlusCircle, FiTrendingUp, FiCalendar, FiEdit3, FiList, FiMaximize2, FiTag, FiLayers } from "react-icons/fi";
import { api } from "../../api/client";
import "./PlantGrowth.css";

// ================= القائمة الموسعة للمحاصيل =================
const cropsList = [
  { ar: "قمح", en: "Wheat" }, { ar: "شعير", en: "Barley" }, { ar: "ذرة", en: "Corn" },
  { ar: "أرز", en: "Rice" }, { ar: "طماطم (بندورة)", en: "Tomato" }, { ar: "بطاطا", en: "Potato" },
  { ar: "بصل", en: "Onion" }, { ar: "ثوم", en: "Garlic" }, { ar: "خيار", en: "Cucumber" },
  { ar: "باذنجان", en: "Eggplant" }, { ar: "فلفل (فليفلة)", en: "Pepper" }, { ar: "كوسا", en: "Zucchini" },
  { ar: "تفاح", en: "Apple" }, { ar: "عنب", en: "Grape" }, { ar: "زيتون", en: "Olive" },
  { ar: "حمضيات", en: "Citrus" }, { ar: "قطن", en: "Cotton" }, { ar: "دوار الشمس", en: "Sunflower" }
];

const getArabicName = (enValue) => {
  if (!enValue) return "";
  const item = cropsList.find(opt => opt.en.toLowerCase() === enValue.toLowerCase());
  return item ? item.ar : enValue;
};

// ================= مكون القائمة القابلة للبحث =================
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
        type="text" className="growth-modern-input" placeholder={placeholder} value={search}
        onChange={(e) => {
          setSearch(e.target.value); setIsOpen(true);
          onSelect({ target: { name, value: "" } });
        }}
        onClick={() => setIsOpen(true)}
      />
      {isOpen && (
        <ul className="dropdown-options-list">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(opt => (
              <li key={opt.en} onClick={() => { setSearch(opt.ar); onSelect({ target: { name, value: opt.en } }); setIsOpen(false); }}>
                {opt.ar}
              </li>
            ))
          ) : <li className="no-result">لا توجد نتائج مطابقة</li>}
        </ul>
      )}
    </div>
  );
};

// دالة حساب الفرق بالأيام بشكل آمن
const getDaysDifference = (date1, date2) => {
  if (!date1 || !date2) return 0;
  const diffTime = Math.abs(new Date(date2) - new Date(date1));
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 0;
};

// ================= المكون الأساسي =================
export default function PlantGrowthTracker() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [farms, setFarms] = useState([]);
  const [lastLog, setLastLog] = useState(null);
  const [growthStats, setGrowthStats] = useState(null);

  const [logCropName, setLogCropName] = useState("");
  const [plantedDate, setPlantedDate] = useState(""); 
  const [logHeight, setLogHeight] = useState(0); 
  const [logLeaves, setLogLeaves] = useState(0); 
  const [logNotes, setLogNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const resetForm = () => {
    setLogCropName("");
    setPlantedDate("");
    setLogHeight(0);
    setLogLeaves(0);
    setLogNotes("");

  };

  // جلب البيانات مع التعامل مع الـ Pagination والفرز الدقيق
  const fetchGrowthData = async () => {
    try {
      const [growthRes, farmsRes] = await Promise.all([
        api.get('/api/plant-growth/'),
        api.get('/api/farms/')
      ]);

      // حل مشكلة Pagination بذكاء
      const activeFarms = Array.isArray(farmsRes.data) ? farmsRes.data : (farmsRes.data?.results || []);
      setFarms(activeFarms);

      const rawGrowthData = Array.isArray(growthRes.data) ? growthRes.data : (growthRes.data?.results || []);

      const formattedLogs = rawGrowthData.map(record => {
        let leavesCount = 0;
        let cleanNotes = record.notes || "";

        if (cleanNotes.startsWith("عدد الأوراق:")) {
          const parts = cleanNotes.split(" | ");
          leavesCount = parseInt(parts[0].replace("عدد الأوراق:", "").trim()) || 0;
          cleanNotes = parts.slice(1).join(" | ");
        }

        const farmObj = activeFarms.find(f => f.id === record.farm);
        const pDate = farmObj ? farmObj.planting_date : record.record_date;
        const age = getDaysDifference(pDate, record.record_date);

        return {
          id: record.id,
          cropName: record.plant_type || (farmObj ? farmObj.crop_type : ""),
          plantedDate: pDate,
          date: record.record_date,
          height: parseFloat(record.height_cm) || 0,
          leaves: leavesCount,
          ageInDays: age,
          notes: cleanNotes
        };
      });

      // فرز القراءات (حسب التاريخ ثم حسب المعرف ID للأيام المتطابقة لضمان ظهور التحديث الأخير)
      formattedLogs.sort((a, b) => {
        const dateDiff = new Date(b.date) - new Date(a.date);
        if (dateDiff !== 0) return dateDiff;
        return b.id - a.id;
      });

      setLogs(formattedLogs);
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        navigate('/login');
      }
      console.error("خطأ في جلب بيانات النمو من قاعدة البيانات:", err);
    }
  };

  useEffect(() => {
    fetchGrowthData();
  }, [navigate]);

  useEffect(() => {
    if (logCropName) {
      const existingFarm = farms.find(f => f.crop_type.toLowerCase() === logCropName.toLowerCase());
      if (existingFarm && existingFarm.planting_date) {
        setPlantedDate(existingFarm.planting_date);
      } else {
        setPlantedDate("");
      }
    }
  }, [logCropName, farms]);

  // تحديث مؤشرات التحليل
  useEffect(() => {
    if (logs.length > 0) {
      const targetCrop = logCropName || logs[0].cropName;
      const cropLogs = logs.filter(log => log.cropName.toLowerCase() === targetCrop.toLowerCase());

      if (cropLogs.length > 0) {
        const latest = cropLogs[0]; // الآن latest سيكون هو التحديث الأحدث دائماً
        setLastLog(latest);

        const averageGrowthRate = latest.height / Math.max(1, latest.ageInDays); 

        let growthStatus = { label: "نمو طبيعي", color: "safe-badge-clr", description: "النبات ينمو بمعدل مستقر وطبيعي." };
        if (averageGrowthRate > 1.5) {
          growthStatus = { label: "سريع وممتاز", color: "good-badge-clr", description: "نمو خضري نشط جداً واستجابة ممتازة للبيئة محفزة." };
        } else if (averageGrowthRate < 0.3) {
          growthStatus = { label: "بطيء", color: "warning-badge-clr", description: "النبات يعاني من بطء في النمو، تحقق من الري والسماد الدقيق." };
        }

        setGrowthStats({
          averageGrowthRate: averageGrowthRate.toFixed(2),
          ageInDays: latest.ageInDays,
          growthStatus: growthStatus
        });
      } else {
        setLastLog(null); setGrowthStats(null);
      }
    } else {
      setLastLog(null); setGrowthStats(null);
    }
  }, [logs, logCropName]);

  const handleAddLog = async (e) => {
    e.preventDefault();
    if (!logCropName || !plantedDate) return alert("يرجى اختيار المحصول وتحديد تاريخ الزراعة!");
    if (new Date(plantedDate) > new Date(todayStr)) return alert("تاريخ الزراعة لا يمكن أن يكون في المستقبل!");
    
    setIsSubmitting(true);
    
    try {
      let targetFarm = farms.find(f => f.crop_type.toLowerCase() === logCropName.toLowerCase());
      
      if (!targetFarm) {
        const farmResponse = await api.post('/api/farms/', {
          name: `مزرعة ${getArabicName(logCropName)}`,
          crop_type: logCropName,
          planting_date: plantedDate,
          location: "موقع افتراضي"
        });
        targetFarm = farmResponse.data;
        setFarms(prev => [...prev, targetFarm]);
      }

      const packedNotes = `عدد الأوراق: ${logLeaves}${logNotes ? ' | ' + logNotes : ''}`;

      await api.post('/api/plant-growth/', {
        farm: targetFarm.id,
        record_date: todayStr,
        plant_type: logCropName,
        height_cm: parseFloat(logHeight),
        notes: packedNotes
      });

      // جلب البيانات مرة أخرى لتحديث الواجهة فوراً
      await fetchGrowthData();
      
      resetForm();
    } catch (error) {
      console.error("فشل حفظ سجل النمو:", error);
      if (error?.response?.status === 403) {
        alert(error?.response?.data?.message || "انتهت صلاحية باقتك أو تجاوزت الحد، يرجى الترقية.");
      } else {
        alert("❌ حدث خطأ غير متوقع أثناء الحفظ في السيرفر.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => setLogCropName(e.target.value);

  return (
    <div className="merged-growth-page-wrapper">
      <img src="/img/bg4.png" className="page-background-image" alt="" />
      <Navbar />

      <main className="growth-tracker-main" dir="rtl">
        <div className="page-header-flex">
          <div className="plant-identity-info">
            <h1 className="main-plant-title">متابعة نمو المحاصيل</h1>
            <p className="plant-subtitle-text">تتبع الطول وعمر النبات بدقة متكاملة مع السيرفر.</p>
          </div>
        </div>

        <div className="growth-dashboard-grid-layout">
          <section className="growth-right-section">
            <div className="modern-glass-panel new-log-panel">
              <h2 className="panel-title-with-icon">
                تسجيل قياسات اليوم <FiPlusCircle className="icon-green" />
              </h2>
              
              <form onSubmit={handleAddLog} className="interactive-slider-form">
                <div className="input-row-flex">
                  <div className="input-group-half">
                    <label><FiTag className="icon-green"/> نوع المحصول:</label>
                    <SearchableDropdown 
                      options={cropsList} 
                      name="cropName" 
                      placeholder="ابحث عن المحصول..." 
                      selectedValue={logCropName} 
                      onSelect={handleInputChange} 
                    />
                  </div>
                  <div className="input-group-half">
                    <label><FiCalendar className="icon-green"/> تاريخ بدء الزرع:</label>
                    <input 
                      type="date" value={plantedDate} 
                      onChange={(e) => setPlantedDate(e.target.value)} 
                      className="growth-modern-input" required 
                    />
                  </div>
                </div>

                <div className="slider-control-group">
                  <div className="slider-header">
                    <label><FiMaximize2 className="icon-green"/> طول النبات لليوم ({todayStr})</label>
                    <span className="slider-value-display">{logHeight} <small>سم</small></span>
                  </div>
                  <input 
                    type="range" min="0" max="300" step="0.5" 
                    value={logHeight} onChange={(e) => setLogHeight(e.target.value)} 
                    className="custom-range-slider"
                  />
                  <div className="slider-ticks"><span>0</span><span>300 سم</span></div>
                </div>

                <div className="slider-control-group">
                  <div className="slider-header">
                    <label><FiLayers className="icon-green"/> إجمالي عدد الأوراق</label>
                    <span className="slider-value-display leaf-value">{logLeaves} <small>ورقة</small></span>
                  </div>
                  <input 
                    type="range" min="0" max="200" step="1" 
                    value={logLeaves} onChange={(e) => setLogLeaves(e.target.value)} 
                    className="custom-range-slider leaf-slider"
                  />
                  <div className="slider-ticks"><span>0</span><span>200 ورقة</span></div>
                </div>

                <div className="input-group-bottom">
                  <label><FiEdit3 className="icon-green"/> ملاحظات إضافية:</label>
                  <textarea value={logNotes} onChange={(e) => setLogNotes(e.target.value)} className="modern-textarea" placeholder="أضف ملاحظاتك حول حالة الأوراق، الإزهار..."></textarea>
                </div>

                <div className="form-footer-actions">
                  <button type="submit" className={`growth-submit-btn ${isSubmitting ? 'loading-state' : ''}`} disabled={isSubmitting}>
                    {isSubmitting ? "جاري مزامنة الحفظ..." : "حفظ القراءة اليومية"}
                  </button>
                </div>
              </form>
            </div>

            <div className="modern-glass-panel history-panel growth-fade-in">
              <h3 className="panel-title-with-icon"><FiList className="icon-green" /> سجل التطور الزمني (من قاعدة البيانات)</h3>
              
              {logs.length === 0 ? (
                <div className="empty-state-message">
                  <p>لا توجد قراءات محفوظة في قاعدة البيانات حتى الآن. اختر محصولاً وسجل قراءتك الأولى!</p>
                </div>
              ) : (
                <div className="growth-timeline-list">
                  {logs.map((log) => (
                    <div key={log.id} className="timeline-item-card">
                      <div className="timeline-dot"></div>
                      <div className="timeline-content-box">
                        <div className="timeline-header">
                          <h4 className="timeline-date">🌱 {getArabicName(log.cropName)}</h4>
                          <span className="timeline-age-badge">عمر النبات: {log.ageInDays} يوم</span>
                        </div>
                        <p className="timeline-stats">
                          التاريخ: {log.date} | الطول: <strong>{log.height} سم</strong> | الأوراق: <strong>{log.leaves}</strong>
                        </p>
                        {log.notes && <p className="timeline-notes">📝 {log.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </section>

          <aside className="growth-left-section">
            <div className="modern-glass-panel analysis-panel">
              <h3 className="panel-title-with-icon">
                تحليل النمو الذكي <FiTrendingUp className="icon-green" />
              </h3>
              
              {!lastLog ? (
                 <div className="empty-analysis-message">
                   <p>أدخل بيانات المحصول من قاعدة البيانات لتنشيط التحليلات.</p>
                 </div>
              ) : (
                <>
                  <div className="current-status-box">
                    <span className="status-label-text">أحدث بيانات حية لـ ({getArabicName(lastLog.cropName)})</span>
                    
                    <div className="status-flex-data mt-3">
                      <div className="status-data-col border-left">
                        <span className="status-value-text">{lastLog.height} <small>سم</small></span>
                        <span className="status-label-small">طول النبات</span>
                      </div>
                      <div className="status-data-col">
                        <span className="status-value-text leaf-text-color">{lastLog.leaves}</span>
                        <span className="status-label-small">عدد الأوراق</span>
                      </div>
                    </div>
                    
                    <div className="status-date-text mt-3">العمر الزمني الإجمالي: <strong>{lastLog.ageInDays} أيام</strong></div>
                  </div>

                  {growthStats && (
                    <div className="growth-smart-analysis-box growth-fade-in">
                      <h4 className="analysis-box-title">مؤشرات الأداء العامة</h4>
                      
                      <div className="analysis-rows-container">
                        <div className="analysis-row">
                          <span className="row-label">متوسط النمو اليومي:</span>
                          <span className="row-value">{growthStats.averageGrowthRate} سم/يوم</span>
                        </div>
                        
                        <div className="analysis-row">
                          <span className="row-label">تقييم سرعة النمو:</span>
                          <span className={`growth-status-badge ${growthStats.growthStatus.color}`}>
                            {growthStats.growthStatus.label}
                          </span>
                        </div>
                      </div>

                      <div className="smart-hint-card">
                        <h5 className="hint-card-title">توصيات النظام:</h5>
                        <p className="hint-card-desc">{growthStats.growthStatus.description}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}