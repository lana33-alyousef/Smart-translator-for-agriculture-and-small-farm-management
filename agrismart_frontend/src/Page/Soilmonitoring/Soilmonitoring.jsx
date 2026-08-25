import React, { useState, useEffect } from 'react';
import { 
  FiThermometer, FiDroplet, FiActivity, 
  FiRefreshCw, FiCheckCircle, FiInfo,
  FiSun, FiCloudRain, FiWind
} from 'react-icons/fi';
import './Soilmonitoring.css';
import Navbar from "../../Component/Navbar/Navbar";

const Soilmonitoring = () => {
  const [farmData, setFarmData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // دالة لتوليد النصائح بناءً على البيانات الحقيقية للتربة والطقس
  const generateRecommendations = (sensors, weather) => {
    const tips = [];
    let idCounter = 1;

    // تحليل الرطوبة والري المرتبط بالطقس
    if (sensors.moisture.value < 40 && weather.condition === 'Clear') {
      tips.push({ id: idCounter++, text: 'جفاف ملحوظ في التربة مع طقس مشمس. يُنصح ببدء دورة الري فوراً لتجنب الإجهاد المائي للنبات.', type: 'water' });
    } else if (sensors.moisture.value > 70 && weather.condition === 'Rainy') {
      tips.push({ id: idCounter++, text: 'مستويات الرطوبة عالية مع توقعات بهطول أمطار. تم تأجيل الري المجدول لتجنب الغدق (تجمع المياه) واختناق الجذور.', type: 'water' });
    } else if (sensors.moisture.value >= 40 && sensors.moisture.value <= 70) {
      tips.push({ id: idCounter++, text: 'مستوى رطوبة التربة مثالي ولا حاجة للتدخل في الوقت الحالي.', type: 'water' });
    }

    // تحليل الحرارة
    if (sensors.temp.value > 35) {
      tips.push({ id: idCounter++, text: 'درجات الحرارة مرتفعة جداً. يُفضل تفعيل نظام التظليل إن وُجد، وزيادة طفيفة في معدل الري للتبريد.', type: 'temp' });
    }

    // تحليل صحة التربة (pH) - بديل السماد
    if (sensors.ph.value < 6.0) {
      tips.push({ id: idCounter++, text: 'التربة تميل إلى الحموضة (pH منخفض). قد تحتاج إلى إضافة الجير الزراعي لتحسين امتصاص العناصر الغذائية.', type: 'ph' });
    } else if (sensors.ph.value > 7.5) {
      tips.push({ id: idCounter++, text: 'قلوية التربة مرتفعة. يُنصح باستخدام أسمدة حمضية التأثير أو إضافة الكبريت الزراعي لخفض الـ pH.', type: 'ph' });
    } else {
      tips.push({ id: idCounter++, text: 'مستوى درجة حموضة التربة (pH) متوازن وممتاز لامتصاص معظم العناصر الغذائية.', type: 'ph' });
    }

    return tips;
  };

const fetchFarmData = async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      // ==========================================
      // 1. جلب بيانات الطقس الحقيقية (OpenWeatherMap كمثال)
      // ==========================================
      // ملاحظة: احصل على مفتاح API مجاني من openweathermap.org وضعه هنا
      const weatherApiKey = 'YOUR_OPENWEATHER_API_KEY'; 
      const city = 'Riyadh'; // يمكنك وضع مدينة المزرعة أو استخدام خطوط الطول والعرض
      
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${weatherApiKey}`
      );
      
      if (!weatherResponse.ok) throw new Error('فشل في جلب بيانات الطقس');
      const weatherData = await weatherResponse.json();

      // تحديد حالة الطقس بناءً على الرد الحقيقي
      let condition = 'Clear';
      if (weatherData.weather[0].main.includes('Rain')) condition = 'Rainy';
      else if (weatherData.weather[0].main.includes('Cloud')) condition = 'Cloudy';

      const realWeather = {
        temp: Math.round(weatherData.main.temp),
        condition: condition,
        wind: weatherData.wind.speed
      };

      // ==========================================
      // 2. جلب بيانات المستشعرات الحقيقية من الباك إند الخاص بك
      // ==========================================
      const sensorResponse = await fetch('http://localhost:5000/api/sensors/current');
      
      if (!sensorResponse.ok) throw new Error('فشل الاتصال بقاعدة بيانات المستشعرات');
      const sensorData = await sensorResponse.json();

      const realSensors = {
        temp: { value: sensorData.temperature, unit: '°C' },
        moisture: { value: sensorData.moisture, unit: '%' },
        ph: { value: sensorData.phLevel, unit: 'pH' }
      };

      // ==========================================
      // 3. تحليل البيانات وتوليد الإشعارات الذكية
      // ==========================================
      const generatedNotes = generateRecommendations(realSensors, realWeather);
      
      const criticalIssues = generatedNotes.filter(n => 
        n.text.includes('فوراً') || n.text.includes('عالية') || n.text.includes('مرتفعة')
      ).length;
      
      const overallStatus = criticalIssues === 0 ? 'مثالية' : criticalIssues < 2 ? 'تتطلب الانتباه' : 'حرجة';

      // تحديث حالة الواجهة (State)
      setFarmData({
        overallStatus,
        lastUpdated: new Date().toLocaleTimeString('ar-SA'),
        weather: realWeather,
        gauges: [
          { id: 1, label: 'درجة حرارة التربة', value: realSensors.temp.value, unit: realSensors.temp.unit, type: 'temp' },
          { id: 2, label: 'رطوبة التربة', value: realSensors.moisture.value, unit: realSensors.moisture.unit, type: 'water' },
          { id: 3, label: 'مستوى الحموضة (pH)', value: realSensors.ph.value, unit: realSensors.ph.unit, type: 'ph' },
        ],
        aiNotes: generatedNotes
      });

    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء الاتصال بالخوادم. يرجى التأكد من تشغيل الباك إند والاتصال بالإنترنت.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFarmData();
  }, []);

  const getGaugeStyle = (type) => {
    switch(type) {
      case 'temp': return { icon: <FiThermometer />, color: 'var(--temp-color)' };
      case 'water': return { icon: <FiDroplet />, color: 'var(--water-color)' };
      case 'ph': return { icon: <FiActivity />, color: 'var(--ph-color)' };
      default: return { icon: <FiInfo />, color: 'var(--soil-text-muted)' };
    }
  };

  const getWeatherIcon = (condition) => {
    switch(condition) {
      case 'Clear': return <FiSun size={24} color="#f59e0b" />;
      case 'Rainy': return <FiCloudRain size={24} color="#3b82f6" />;
      default: return <FiWind size={24} color="#94a3b8" />;
    }
  };

  if (loading) {
    return (
      <div className="soil-monitoring-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <h2>جاري مزامنة قراءات المستشعرات والطقس...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="soil-monitoring-page">
        <div className="error-container">
          <FiInfo size={50} color="#ef4444" style={{marginBottom: '20px'}} />
          <h2>انقطع الاتصال</h2>
          <p>{error}</p>
          <button className="refresh-btn" onClick={fetchFarmData} style={{marginTop: '15px'}}>
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadgeClass = (status) => {
    if (status === 'مثالية') return 'status-badge good';
    if (status === 'تتطلب الانتباه') return 'status-badge warning';
    return 'status-badge critical';
  };

  return (
    <div className='soil-monitoring'>
      <img src="/img/bg1.png" className="page-background-image" alt="Background" />
      <Navbar />
      
      <div className='soil-monitoring-page'>
        {/* الترويسة */}
        <header className="soil-header">
          <div className="soil-title-container">
            <h1>
              مراقبة التربة والري الذكي
              <span className={getStatusBadgeClass(farmData.overallStatus)}>
                الحالة: {farmData.overallStatus}
              </span>
            </h1>
            <p>مزامنة البيانات الحية: {farmData.lastUpdated}</p>
          </div>
          
          <div className="weather-widget">
            <div className="weather-info">
              <span className="weather-temp">{farmData.weather.temp}°C</span>
              <span className="weather-label">الطقس الخارجي</span>
            </div>
            {getWeatherIcon(farmData.weather.condition)}
          </div>

          <button className="refresh-btn" onClick={fetchFarmData} disabled={isRefreshing}>
            <FiRefreshCw className={`refresh-icon ${isRefreshing ? 'spinning' : ''}`} />
            {isRefreshing ? 'جاري القراءة...' : 'تحديث المستشعرات'}
          </button>
        </header>

        {/* المحتوى الرئيسي */}
        <div className="soil-dashboard-layout">
          
          {/* قسم قراءات الحساسات */}
          <div className="soil-card">
            <h3 className="card-title"><FiActivity /> القراءات المباشرة للتربة</h3>
            <div className="gauges-container">
              {farmData.gauges.map((gauge) => {
                const style = getGaugeStyle(gauge.type);
                return (
                  <div className="gauge-box" key={gauge.id}>
                    <div className="gauge-icon" style={{ backgroundColor: style.color }}>
                      {style.icon}
                    </div>
                    <div className="gauge-info">
                      <h4>{gauge.label}</h4>
                      <p>{gauge.value} <span style={{fontSize: '1rem'}}>{gauge.unit}</span></p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* قسم تحليل النظام والملاحظات */}
          <div className="soil-card">
            <h3 className="card-title"><FiCheckCircle /> التحليلات وتوصيات النظام الذكي</h3>
            <div className="notes-list">
              {farmData.aiNotes.map((note) => {
                const style = getGaugeStyle(note.type);
                return (
                  <div className="note-item" key={note.id} style={{ borderRightColor: style.color }}>
                    <div style={{ color: style.color, fontSize: '1.4rem', marginTop: '2px' }}>
                      {style.icon}
                    </div>
                    <p>{note.text}</p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Soilmonitoring;