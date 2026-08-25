import React, { useEffect, useState } from "react";
import "./ReportsHome.css";
import ReportHeader from "../../Component/Navbar/Navbar";
import StatsCard from "../../Component/StatsCard/StatsCard";
import { api } from "../../api/client"; 
import { FiCloudRain, FiThermometer, FiWind, FiDroplet, FiInfo, FiDownload } from "react-icons/fi";

const STATUS_MAP = {
  excellent: { label: "ممتازة", color: "#10b981" }, // Updated for dark mode neon
  good: { label: "جيدة", color: "#34d399" },
  medium: { label: "متوسطة", color: "#fbbf24" },
  danger: { label: "حرجة", color: "#ef4444" },
};

export default function ReportsHome() {
  const [type, setType] = useState("daily");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [soilSamples, setSoilSamples] = useState([]);
  const [latestSchedule, setLatestSchedule] = useState(null);

  const fetchFarmReport = async (reportType) => {
    setLoading(true);
    setError(null);
    try {
      const [reportRes, soilRes, schedRes] = await Promise.all([
        api.get(`/api/farm-report/?type=${reportType}`),
        api.get(`/api/soil-samples/?page_size=5`),
        api.get(`/api/schedules/?page_size=5`)
      ]);
      
      setData(reportRes.data);
      setSoilSamples(Array.isArray(soilRes.data) ? soilRes.data : (soilRes.data.results || []));
      
      const schedList = Array.isArray(schedRes.data) ? schedRes.data : (schedRes.data.results || []);
      const currentSchedule = schedList.length > 0 ? schedList[0] : null;
      setLatestSchedule(currentSchedule);

    } catch (err) {
      if (err?.response?.status === 404) {
        setError("لا توجد مزرعة مسجلة لعرض التقارير. يرجى إضافة مزرعتك وعينات التربة أولاً.");
      } else {
        setError("تعذر جلب التقارير من الخادم.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmReport(type);
  }, [type]);

  const handleExportCSV = () => {
    if (!data) return;

    // 1. تجهيز مصفوفة البيانات (صفوف الـ CSV)
    const csvRows = [];

    // إضافة ترويسة رئيسية
    csvRows.push(['القسم', 'التفاصيل', 'معلومات إضافية']);
    
    // -- قسم المعلومات العامة --
    csvRows.push(['--- الحالة العامة ---', '', '']);
    csvRows.push(['نوع التقرير', type === "daily" ? "يومي" : "شهري", '']);
    csvRows.push(['حالة المزرعة', status.label, '']);

    // -- قسم معلومات المحصول --
    if (latestSchedule) {
      csvRows.push(['', '', '']); // سطر فارغ للترتيب
      csvRows.push(['--- معلومات المحصول ---', '', '']);
      csvRows.push(['المحصول', latestSchedule.crop || 'غير محدد', '']);
      csvRows.push(['المدينة', latestSchedule.city || 'غير محدد', '']);
      csvRows.push(['موعد الري القادم', latestSchedule.irr_date ? new Date(latestSchedule.irr_date).toLocaleDateString('ar-EG') : 'غير محدد', '']);
      csvRows.push(['الاستهلاك المقترح', latestSchedule.api_data?.water_suggestion || 'غير متوفر', '']);
    }

    // -- قسم الطقس --
    if (data.weather) {
      csvRows.push(['', '', '']);
      csvRows.push(['--- بيانات الطقس ---', '', '']);
      csvRows.push(['درجة الحرارة', `${data.weather.temperature || 0} °C`, '']);
      csvRows.push(['الأمطار', `${data.weather.rainfall || 0} mm`, '']);
      csvRows.push(['سرعة الرياح', `${data.weather.wind_speed || 0} km/h`, '']);
      csvRows.push(['الرطوبة', `${data.weather.humidity || 0} %`, '']);
    }

    // -- قسم الإحصائيات السريعة --
    if (data.stats && data.stats.length > 0) {
      csvRows.push(['', '', '']);
      csvRows.push(['--- الإحصائيات ---', '', '']);
      data.stats.forEach(s => {
        csvRows.push([s.label, s.value, '']);
      });
    }

    // -- قسم الإرشاد الذكي --
    if (actions && actions.length > 0) {
      csvRows.push(['', '', '']);
      csvRows.push(['--- الإرشاد الذكي والإجراءات ---', '', '']);
      actions.forEach(action => {
        csvRows.push(['إجراء مقترح', action, '']);
      });
    }

    // -- قسم سجل الخدمات (متعدد الأعمدة) --
    if (data.activities_log && data.activities_log.length > 0) {
      csvRows.push(['', '', '']);
      csvRows.push(['--- سجل الخدمات ---', '', '']);
      csvRows.push(['اسم الخدمة', 'الوصف', 'التاريخ']);
      data.activities_log.forEach(log => {
        csvRows.push([
          log.service_name || '',
          log.description || '',
          new Date(log.timestamp).toLocaleDateString('ar-EG')
        ]);
      });
    }

    // 2. تحويل المصفوفة إلى نص CSV صالح
    // \uFEFF هو (Byte Order Mark) لدعم اللغة العربية في Excel
    const BOM = '\uFEFF';
    const csvContent = BOM + csvRows.map(row => 
      row.map(cell => {
        // تنظيف النصوص من الفواصل وعلامات التنصيص لتجنب كسر الأعمدة
        const cellString = String(cell !== undefined && cell !== null ? cell : '');
        return `"${cellString.replace(/"/g, '""')}"`;
      }).join(',')
    ).join('\n');

    // 3. إنشاء رابط وهمي لتحميل الملف
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `تقرير_المزرعة_${type}_${new Date().toISOString().split('T')[0]}.csv`);
    
    // تشغيل التحميل
    document.body.appendChild(link);
    link.click();
    
    // التنظيف
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const status = STATUS_MAP[data?.status] || STATUS_MAP.good;

  const computeActions = () => {
    const actions = [];
    const weather = data?.weather || {};

    if (data?.status === 'danger') {
      actions.push('تنبيه فوري: أرض جافة جداً — رتب لتشغيل الري الآن.');
    } else if (data?.status === 'medium') {
      actions.push('مراقبة: درجات الحرارة مرتفعة — قم بالري في الصباح الباكر أو مساءً.');
    } else {
      actions.push('الحالة مستقرة — استمر بمتابعة الجدول الروتيني.');
    }

    if (weather?.rainfall > 5) {
      actions.push('متوقع هطول أمطار — قلل من كميات الري المجدولة لتوفير المياه.');
    }

    if (latestSchedule?.api_data?.water_suggestion) {
      actions.push(`الكمية المقترحة تقريباً: ${latestSchedule.api_data.water_suggestion}`);
    }

    return actions;
  };

  const actions = computeActions();

  const buildWaterSeries = () => {
    let suggestedValue = 0;
    try {
      const suggestionStr = latestSchedule?.api_data?.water_suggestion || '';
      const match = suggestionStr.match(/([0-9]+(?:[.,][0-9]+)?)/);
      if (match) suggestedValue = Number(match[1].replace(',', '.'));
    } catch (e) { console.error("Error parsing suggestion:", e); }

    const base = type === 'monthly' ? suggestedValue * 30 : suggestedValue;
    const series = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const noise = i === 0 ? 0 : Math.round((Math.sin(i) * 0.05) * base);
      series.push({ date: iso, value: Math.max(0, base + noise) });
    }
    return series;
  };

  const waterSeries = buildWaterSeries();

  function WaterTimeline({ series }) {
    const width = 760;
    const height = 180;
    const padding = 28;
    const values = series.map(s => s.value);
    const max = Math.max(...values, 10);
    const min = Math.min(...values, 0);
    const range = max - min || 1;

    const points = series.map((s, i) => {
      const x = padding + (i * (width - padding * 2) / (series.length - 1));
      const y = padding + ((1 - (s.value - min) / range) * (height - padding * 2));
      return { x, y, ...s };
    });

    const pathD = points.map((p, i) => `${i===0? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const [hover, setHover] = useState(null);

    return (
      <div className="water-timeline">
        <h4>مخطط الاستهلاك المستهدف (آخر 7 أيام)</h4>
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="neonGreen" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d={`${pathD} L ${points[points.length-1].x} ${height-padding} L ${points[0].x} ${height-padding} Z`} fill="url(#neonGreen)" stroke="none" />
          <path d={pathD} fill="none" stroke="#10b981" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
          {points.map((p, idx) => (
            <g key={p.date} onMouseEnter={() => setHover({idx, p})} onMouseLeave={() => setHover(null)}>
              <circle cx={p.x} cy={p.y} r={6} fill="#0f172a" stroke="#10b981" strokeWidth={2.5} style={{cursor: 'pointer', transition: 'all 0.2s'}} />
            </g>
          ))}
        </svg>

        <div className="water-timeline__labels">
          {series.map((s) => (
            <div key={s.date} className="wt-label">{new Date(s.date).toLocaleDateString('ar-EG', {month:'short', day:'numeric'})}</div>
          ))}
        </div>

        {hover && (
          <div className="water-timeline__tooltip" style={{ left: hover.p.x - 40, top: hover.p.y - 60 }}>
            <div style={{color: '#cbd5e1'}}>{new Date(hover.p.date).toLocaleDateString('ar-EG')}</div>
            <div style={{fontWeight:700, color: '#34d399', fontSize: '16px'}}>{hover.p.value} لتر</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="reports-home">
      <ReportHeader />

      <main className="reports-home__content" dir="rtl">
        {loading ? (
          <div className="glass-card bento-header" style={{textAlign: 'center'}}>
             <div className="spinner"></div>
             <h3>جاري تحليل البيانات وإعداد التقرير...</h3>
          </div>
        ) : error ? (
          <div className="glass-card bento-header" style={{textAlign: 'center', borderColor: '#ef4444'}}>
             <h3 style={{color: '#ef4444'}}>{error}</h3>
          </div>
        ) : (
          <>
            {/* Header & Controls */}
            <section className="glass-card bento-header">
              <div className="reports-home__header-controls">
                <div className="reports-home__toggle-group">
                  <button className={`toggle-btn ${type === "daily" ? "active" : ""}`} onClick={() => setType("daily")}>
                    التقارير اليومية
                  </button>
                  <button className={`toggle-btn ${type === "monthly" ? "active" : ""}`} onClick={() => setType("monthly")}>
                    التقارير الشهرية
                  </button>
                </div>
                <button className="csv-export-btn" onClick={handleExportCSV}>
                  <FiDownload /> تصدير التقرير (CSV)
                </button>
              </div>

              <div className="reports-home__state">
                <h2>الحالة العامة للمزرعة</h2>
                <div className="reports-home__state-badge" style={{ background: status.color, boxShadow: `0 4px 20px ${status.color}40` }}>
                  <span>{status.label}</span>
                </div>
              </div>

              {latestSchedule && (
                <div className="reports-home__crop-card">
                  <div className="crop-info">
                    <h3>المحصول الحالي: {latestSchedule.crop}</h3>
                    <p>المنطقة: {latestSchedule.city}</p>
                    <p>الموعد التالي للري: {latestSchedule.irr_date ? new Date(latestSchedule.irr_date).toLocaleDateString('ar-EG') : 'غير محدد'}</p>
                  </div>
                  <div className="crop-actions">
                    <strong style={{color: '#f8fafc'}}>الاستهلاك المقترح:</strong>
                    <div className="suggestion">{(latestSchedule.api_data && latestSchedule.api_data.water_suggestion) || 'غير متوفر'}</div>
                  </div>
                </div>
              )}
            </section>

            {/* Quick Stats Grid */}
            <section className="bento-stats">
              <div className="reports-home__stats-grid">
                {data?.stats?.map((s) => (
                  <StatsCard key={s.id} icon={s.icon} label={s.label} value={s.value} variant={s.variant} />
                ))}
              </div>
            </section>

            {/* Main Chart */}
            <section className="glass-card bento-chart">
              <WaterTimeline series={waterSeries} />
            </section>

            {/* Weather Panel */}
            <section className="glass-card bento-weather">
              <h3 style={{margin: 0, color: '#f8fafc'}}>الطقس ({latestSchedule?.city || 'الحالي'})</h3>
              <div className="weather-data-grid">
                <div className="weather-box temp">
                  <FiThermometer className="w-icon" />
                  <span>الحرارة</span>
                  <strong>{data?.weather?.temperature || '--'}°C</strong>
                </div>
                <div className="weather-box rain">
                  <FiCloudRain className="w-icon" />
                  <span>الأمطار</span>
                  <strong>{data?.weather?.rainfall || '--'} mm</strong>
                </div>
                <div className="weather-box wind">
                  <FiWind className="w-icon" />
                  <span>الرياح</span>
                  <strong>{data?.weather?.wind_speed || '--'} km/h</strong>
                </div>
                <div className="weather-box humidity">
                  <FiDroplet className="w-icon" />
                  <span>الرطوبة</span>
                  <strong>{data?.weather?.humidity || '--'}%</strong>
                </div>
              </div>
            </section>

            {/* AI Guidance */}
            <section className="glass-card bento-guidance">
              <h3 style={{display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0', color: '#10b981'}}>
                <FiInfo className="guidance-icon"/> الإرشاد الذكي
              </h3>
              <div className="guidance-message">
                <p style={{fontSize:18, fontWeight:700, marginBottom:16, color: '#f8fafc'}}>
                  {data?.guidance || "نصائح وإرشادات مخصصة لمحصولك بناءً على المعطيات الحالية."}
                </p>
                <ul style={{textAlign:'right', paddingRight:20, margin:0}}>
                  {actions.map((a,i) => <li key={i} style={{fontWeight:600}}>{a}</li>)}
                </ul>
              </div>
            </section>

            {/* Activity Logs */}
            <section className="glass-card bento-logs">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <h3 style={{color: '#4d525aff', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px'}}>سجل الخدمات</h3>
                  {data?.activities_log && data.activities_log.length > 0 ? (
                    <ul className="activity-timeline" style={{listStyle: 'none', padding: 0}}>
                      {data.activities_log.map((log, i) => (
                        <li key={i} className="activity-item">
                          <span className="activity-service">{log.service_name}</span>
                          <span className="activity-desc">{log.description}</span>
                          <span className="activity-time">{new Date(log.timestamp).toLocaleDateString('ar-EG')}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{color: '#4d525aff', fontSize: '14px'}}>لا توجد أنشطة مسجلة.</p>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}